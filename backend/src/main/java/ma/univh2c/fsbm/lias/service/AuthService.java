package ma.univh2c.fsbm.lias.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.univh2c.fsbm.lias.dto.*;
import ma.univh2c.fsbm.lias.entity.JetonSecurite;
import ma.univh2c.fsbm.lias.entity.Membre;
import ma.univh2c.fsbm.lias.enums.EtatCompte;
import ma.univh2c.fsbm.lias.enums.TypeJeton;
import ma.univh2c.fsbm.lias.exception.AccesRefuseException;
import ma.univh2c.fsbm.lias.exception.RegleMetierException;
import ma.univh2c.fsbm.lias.exception.RessourceIntrouvableException;
import ma.univh2c.fsbm.lias.repository.JetonSecuriteRepository;
import ma.univh2c.fsbm.lias.repository.MembreRepository;
import ma.univh2c.fsbm.lias.security.JwtTokenProvider;
import ma.univh2c.fsbm.lias.security.MembreDetails;
import ma.univh2c.fsbm.lias.security.MembreUserDetailsService;
import ma.univh2c.fsbm.lias.security.SecurityService;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final MembreRepository membreRepository;
    private final JetonSecuriteRepository jetonRepository;
    private final MembreUserDetailsService userDetailsService;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final SecurityService securityService;

    @Transactional
    public AuthResponseDTO login(LoginRequest request) {
        Membre membre = membreRepository.findByEmailIgnoreCase(request.getEmail().trim())
                .orElseThrow(() -> new BadCredentialsException("Email ou mot de passe incorrect"));

        if (!passwordEncoder.matches(request.getMotDePasse(), membre.getMotDePasse())) {
            throw new BadCredentialsException("Email ou mot de passe incorrect");
        }

        if (membre.getEtatCompte() == EtatCompte.GELE) {
            throw new AccesRefuseException("Votre compte est gelé (membre retraité). Connexion impossible.");
        }
        if (membre.getEtatCompte() == EtatCompte.DESACTIVE) {
            throw new AccesRefuseException("Votre compte est désactivé (ancien membre). Connexion impossible.");
        }

        MembreDetails membreDetails = (MembreDetails) userDetailsService.loadUserByUsername(membre.getEmail());

        String accessToken = jwtTokenProvider.generateAccessToken(membreDetails);
        String refreshToken = jwtTokenProvider.generateRefreshToken(membreDetails);

        JetonSecurite jeton = JetonSecurite.builder()
                .hashJeton(jwtTokenProvider.hashToken(refreshToken))
                .type(TypeJeton.REFRESH)
                .dateCreation(LocalDateTime.now())
                .dateExpiration(LocalDateTime.now().plusDays(7))
                .revoque(false)
                .utilise(false)
                .membre(membre)
                .build();
        jetonRepository.save(jeton);

        return AuthResponseDTO.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .doitChangerMotDePasse(membre.getDoitChangerMotDePasse())
                .membre(convertirEnInterneDTO(membre, membreDetails))
                .build();
    }

    @Transactional
    public AuthResponseDTO refresh(RefreshRequest request) {
        String token = request.getRefreshToken();
        if (!jwtTokenProvider.validateToken(token)) {
            throw new AccesRefuseException("Jeton de rafraîchissement invalide ou expiré");
        }

        String hash = jwtTokenProvider.hashToken(token);
        JetonSecurite jetonExistant = jetonRepository.findByHashJetonAndType(hash, TypeJeton.REFRESH)
                .orElseThrow(() -> new AccesRefuseException("Jeton de rafraîchissement non reconnu"));

        if (!jetonExistant.estValide()) {
            throw new AccesRefuseException("Jeton de rafraîchissement révoqué ou expiré");
        }

        // Rotation du jeton
        jetonExistant.setRevoque(true);
        jetonRepository.save(jetonExistant);

        Membre membre = jetonExistant.getMembre();
        if (membre.getEtatCompte() != EtatCompte.ACTIF) {
            throw new AccesRefuseException("Le compte n'est plus actif");
        }

        MembreDetails membreDetails = (MembreDetails) userDetailsService.loadUserByUsername(membre.getEmail());

        String nouveauAccessToken = jwtTokenProvider.generateAccessToken(membreDetails);
        String nouveauRefreshToken = jwtTokenProvider.generateRefreshToken(membreDetails);

        JetonSecurite nouveauJeton = JetonSecurite.builder()
                .hashJeton(jwtTokenProvider.hashToken(nouveauRefreshToken))
                .type(TypeJeton.REFRESH)
                .dateCreation(LocalDateTime.now())
                .dateExpiration(LocalDateTime.now().plusDays(7))
                .revoque(false)
                .utilise(false)
                .membre(membre)
                .build();
        jetonRepository.save(nouveauJeton);

        return AuthResponseDTO.builder()
                .accessToken(nouveauAccessToken)
                .refreshToken(nouveauRefreshToken)
                .tokenType("Bearer")
                .doitChangerMotDePasse(membre.getDoitChangerMotDePasse())
                .membre(convertirEnInterneDTO(membre, membreDetails))
                .build();
    }

    @Transactional(readOnly = true)
    public MeDTO me() {
        Long currentId = securityService.getIdUtilisateurConnecte();
        if (currentId == null) {
            throw new AccesRefuseException("Non authentifié");
        }

        Membre membre = membreRepository.findById(currentId)
                .orElseThrow(() -> new RessourceIntrouvableException("Membre introuvable"));

        MembreDetails details = (MembreDetails) userDetailsService.loadUserByUsername(membre.getEmail());

        return MeDTO.builder()
                .id(membre.getId())
                .email(membre.getEmail())
                .nom(membre.getNom())
                .prenom(membre.getPrenom())
                .photo(membre.getPhoto())
                .roleSysteme(membre.getRoleSysteme())
                .statut(membre.getStatut())
                .etatCompte(membre.getEtatCompte())
                .equipeId(membre.getEquipeActuelle() != null ? membre.getEquipeActuelle().getId() : null)
                .equipeNom(membre.getEquipeActuelle() != null ? membre.getEquipeActuelle().getNom() : null)
                .autorites(details.getAuthorities().stream().map(GrantedAuthority::getAuthority).collect(Collectors.toList()))
                .doitChangerMotDePasse(membre.getDoitChangerMotDePasse())
                .build();
    }

    @Transactional
    public void logout(String refreshToken) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            String hash = jwtTokenProvider.hashToken(refreshToken);
            jetonRepository.findByHashJetonAndType(hash, TypeJeton.REFRESH).ifPresent(j -> {
                j.setRevoque(true);
                jetonRepository.save(j);
            });
        }
        Long currentId = securityService.getIdUtilisateurConnecte();
        if (currentId != null) {
            jetonRepository.revoquerTousJetonsDuMembre(currentId);
        }
    }

    @Transactional
    public void changerMotDePasse(ChangementMotDePasseRequest request) {
        Long currentId = securityService.getIdUtilisateurConnecte();
        if (currentId == null) {
            throw new AccesRefuseException("Non authentifié");
        }

        Membre membre = membreRepository.findById(currentId)
                .orElseThrow(() -> new RessourceIntrouvableException("Membre introuvable"));

        if (!Boolean.TRUE.equals(membre.getDoitChangerMotDePasse())) {
            if (request.getAncienMotDePasse() == null || !passwordEncoder.matches(request.getAncienMotDePasse(), membre.getMotDePasse())) {
                throw new RegleMetierException("L'ancien mot de passe est incorrect");
            }
        }

        membre.setMotDePasse(passwordEncoder.encode(request.getNouveauMotDePasse()));
        membre.setDoitChangerMotDePasse(false);
        membreRepository.save(membre);

        jetonRepository.revoquerTousJetonsDuMembre(membre.getId());
    }

    @Transactional
    public void demanderReinitialisation(MotDePasseOublieRequest request) {
        membreRepository.findByEmailIgnoreCase(request.getEmail().trim()).ifPresent(membre -> {
            if (membre.getEtatCompte() == EtatCompte.ACTIF) {
                String jetonBrut = UUID.randomUUID().toString();
                String hash = jwtTokenProvider.hashToken(jetonBrut);

                JetonSecurite jeton = JetonSecurite.builder()
                        .hashJeton(hash)
                        .type(TypeJeton.RESET_MDP)
                        .dateCreation(LocalDateTime.now())
                        .dateExpiration(LocalDateTime.now().plusMinutes(30))
                        .revoque(false)
                        .utilise(false)
                        .membre(membre)
                        .build();
                jetonRepository.save(jeton);

                String lien = "http://localhost:5173/reset-password?token=" + jetonBrut;
                emailService.envoyerEmailReinitialisation(membre.getEmail(), lien);
            }
        });
    }

    @Transactional
    public void reinitialiserMotDePasse(ReinitialisationRequest request) {
        String hash = jwtTokenProvider.hashToken(request.getJeton());
        JetonSecurite jeton = jetonRepository.findByHashJetonAndType(hash, TypeJeton.RESET_MDP)
                .orElseThrow(() -> new RegleMetierException("Lien de réinitialisation invalide ou expiré"));

        if (!jeton.estValide()) {
            throw new RegleMetierException("Lien de réinitialisation déjà utilisé ou expiré");
        }

        Membre membre = jeton.getMembre();
        membre.setMotDePasse(passwordEncoder.encode(request.getNouveauMotDePasse()));
        membre.setDoitChangerMotDePasse(false);
        membreRepository.save(membre);

        jeton.setUtilise(true);
        jetonRepository.save(jeton);

        jetonRepository.revoquerTousJetonsDuMembre(membre.getId());
    }

    private MembreInterneDTO convertirEnInterneDTO(Membre m, MembreDetails details) {
        List<String> auths = details != null
                ? details.getAuthorities().stream().map(GrantedAuthority::getAuthority).collect(Collectors.toList())
                : Collections.emptyList();

        return MembreInterneDTO.builder()
                .id(m.getId())
                .photo(m.getPhoto())
                .nom(m.getNom())
                .prenom(m.getPrenom())
                .email(m.getEmail())
                .roleSysteme(m.getRoleSysteme())
                .statut(m.getStatut())
                .etatCompte(m.getEtatCompte())
                .etablissementOrigine(m.getEtablissementOrigine())
                .laboratoireOrigine(m.getLaboratoireOrigine())
                .biographie(m.getBiographie())
                .centresInteret(m.getCentresInteret() != null ? new ArrayList<>(m.getCentresInteret()) : new ArrayList<>())
                .dateEmbauche(m.getDateEmbauche())
                .dateAffiliation(m.getDateAffiliation())
                .dateRetraite(m.getDateRetraite())
                .dateDepart(m.getDateDepart())
                .equipeId(m.getEquipeActuelle() != null ? m.getEquipeActuelle().getId() : null)
                .equipeNom(m.getEquipeActuelle() != null ? m.getEquipeActuelle().getNom() : null)
                .autorites(auths)
                .authorities(auths)
                .build();
    }
}

package ma.univh2c.fsbm.lias.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.univh2c.fsbm.lias.dto.DemandeAdhesionDTO;
import ma.univh2c.fsbm.lias.dto.DemandeAdhesionRequest;
import ma.univh2c.fsbm.lias.dto.PageDTO;
import ma.univh2c.fsbm.lias.entity.*;
import ma.univh2c.fsbm.lias.enums.*;
import ma.univh2c.fsbm.lias.exception.ConflitEtatException;
import ma.univh2c.fsbm.lias.exception.RegleMetierException;
import ma.univh2c.fsbm.lias.exception.RessourceIntrouvableException;
import ma.univh2c.fsbm.lias.repository.*;
import ma.univh2c.fsbm.lias.security.SecurityService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DemandeAdhesionService {

    private final DemandeAdhesionRepository demandeRepository;
    private final MembreRepository membreRepository;
    private final PeriodeAffiliationRepository periodeRepository;
    private final MandatRepository mandatRepository;
    private final EquipeRepository equipeRepository;
    private final FileStorageService fileStorageService;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final SecurityService securityService;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public DemandeAdhesionDTO soumettreDemande(DemandeAdhesionRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        if (membreRepository.existsByEmail(email)) {
            throw new ConflitEtatException("Un compte membre existe déjà avec cet email");
        }
        if (demandeRepository.existsByEmailAndStatut(email, StatutDemande.EN_ATTENTE)) {
            throw new ConflitEtatException("Une demande d'adhésion est déjà en cours d'examen pour cet email");
        }

        String cvUrl = null;
        if (request.getCv() != null && !request.getCv().isEmpty()) {
            cvUrl = fileStorageService.stockerFichier(request.getCv(), "candidatures");
        }

        String lettreMotivationUrl = null;
        if (request.getLettreMotivation() != null && !request.getLettreMotivation().isEmpty()) {
            lettreMotivationUrl = fileStorageService.stockerFichier(request.getLettreMotivation(), "candidatures");
        }

        DemandeAdhesion demande = DemandeAdhesion.builder()
                .nom(request.getNom().trim())
                .prenom(request.getPrenom().trim())
                .email(email)
                .statutSouhaite(request.getStatutSouhaite())
                .equipeSouhaitee(request.getEquipeId() != null ? equipeRepository.findById(request.getEquipeId()).orElse(null) : null)
                .etablissementOrigine(request.getEtablissementOrigine())
                .laboratoireOrigine(request.getLaboratoireOrigine())
                .cvUrl(cvUrl)
                .lettreMotivationUrl(lettreMotivationUrl)
                .motivation(request.getMotivation())
                .dateSoumission(LocalDateTime.now())
                .statut(StatutDemande.EN_ATTENTE)
                .build();

        DemandeAdhesion saved = demandeRepository.save(demande);

        // Notifier la Direction
        notificationService.notifierDirection(
                "Nouvelle candidature d'adhésion",
                "Une nouvelle candidature a été déposée par " + saved.getPrenom() + " " + saved.getNom() + " (" + saved.getEmail() + ").",
                TypeNotification.DEMANDE_ADHESION,
                "/gouvernance/adhesions"
        );

        return convertirEnDTO(saved);
    }

    @Transactional(readOnly = true)
    public PageDTO<DemandeAdhesionDTO> rechercherDemandes(StatutDemande statut, Pageable pageable) {
        Page<DemandeAdhesion> page;
        if (statut != null) {
            page = demandeRepository.findByStatutOrderByDateSoumissionDesc(statut, pageable);
        } else {
            page = demandeRepository.findAllByOrderByDateSoumissionDesc(pageable);
        }
        return PageDTO.from(page, page.getContent().stream().map(this::convertirEnDTO).collect(Collectors.toList()));
    }

    @Transactional(readOnly = true)
    public DemandeAdhesionDTO getDemandeParId(Long id) {
        DemandeAdhesion d = demandeRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Demande d'adhésion introuvable"));
        return convertirEnDTO(d);
    }

    @Transactional
    public void accepterDemande(Long id, StatutMembre statutAjuste) {
        accepterDemande(id, statutAjuste, null);
    }

    @Transactional
    public void accepterDemande(Long id, StatutMembre statutAjuste, Long equipeId) {
        DemandeAdhesion d = demandeRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Demande d'adhésion introuvable"));

        if (d.getStatut() != StatutDemande.EN_ATTENTE) {
            throw new ConflitEtatException("Cette demande a déjà été traitée");
        }

        Long currentId = securityService.getIdUtilisateurConnecte();
        Membre directeur = currentId != null ? membreRepository.findById(currentId).orElse(null) : null;

        StatutMembre statutFinal = statutAjuste != null ? statutAjuste : d.getStatutSouhaite();

        // Générer mot de passe temporaire
        String motDePasseTemporaire = "Lias@" + (int)(Math.random() * 900000 + 100000);

        Equipe equipe = equipeId != null ? equipeRepository.findById(equipeId).orElse(null) : d.getEquipeSouhaitee();

        Membre nouveauMembre = Membre.builder()
                .nom(d.getNom())
                .prenom(d.getPrenom())
                .email(d.getEmail())
                .motDePasse(passwordEncoder.encode(motDePasseTemporaire))
                .doitChangerMotDePasse(true)
                .roleSysteme(RoleSysteme.UTILISATEUR)
                .statut(statutFinal)
                .etatCompte(EtatCompte.ACTIF)
                .etablissementOrigine(d.getEtablissementOrigine())
                .laboratoireOrigine(d.getLaboratoireOrigine())
                .dateAffiliation(LocalDate.now())
                .equipeActuelle(equipe)
                .build();

        Membre membreCree = membreRepository.save(nouveauMembre);

        // Première période d'affiliation
        PeriodeAffiliation periode = PeriodeAffiliation.builder()
                .dateDebut(LocalDate.now())
                .membre(membreCree)
                .build();
        periodeRepository.save(periode);

        d.accepter(directeur);
        d.setMembreCree(membreCree);
        demandeRepository.save(d);

        // Envoyer email avec identifiants
        emailService.envoyerEmailAcces(membreCree.getEmail(), membreCree.getPrenom() + " " + membreCree.getNom(), motDePasseTemporaire);

        // Notifier le nouveau compte membre
        notificationService.creerNotification(
                membreCree,
                "Bienvenue au Laboratoire LIAS",
                "Votre adhésion a été validée. Vous pouvez désormais personnaliser votre profil et explorer l'intranet.",
                TypeNotification.MEMBRE,
                "/profil"
        );
    }

    @Transactional
    public void refuserDemande(Long id, String motif) {
        DemandeAdhesion d = demandeRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Demande d'adhésion introuvable"));

        if (d.getStatut() != StatutDemande.EN_ATTENTE) {
            throw new ConflitEtatException("Cette demande a déjà été traitée");
        }

        Long currentId = securityService.getIdUtilisateurConnecte();
        Membre directeur = currentId != null ? membreRepository.findById(currentId).orElse(null) : null;

        d.refuser(directeur, motif);
        demandeRepository.save(d);

        emailService.envoyerEmailRefus(d.getEmail(), d.getPrenom() + " " + d.getNom(), motif);

        notificationService.notifierDirection(
                "Candidature non retenue",
                "La candidature d'adhésion de " + d.getPrenom() + " " + d.getNom() + " a été refusée.",
                TypeNotification.DEMANDE_ADHESION,
                "/gouvernance/adhesions"
        );
    }

    public DemandeAdhesionDTO convertirEnDTO(DemandeAdhesion d) {
        return DemandeAdhesionDTO.builder()
                .id(d.getId())
                .nom(d.getNom())
                .prenom(d.getPrenom())
                .email(d.getEmail())
                .statutSouhaite(d.getStatutSouhaite())
                .equipeId(d.getEquipeSouhaitee() != null ? d.getEquipeSouhaitee().getId() : null)
                .equipeNom(d.getEquipeSouhaitee() != null ? d.getEquipeSouhaitee().getNom() : null)
                .etablissementOrigine(d.getEtablissementOrigine())
                .laboratoireOrigine(d.getLaboratoireOrigine())
                .cvUrl(d.getCvUrl() != null ? "/api/demandes/" + d.getId() + "/cv" : null)
                .lettreMotivationUrl(d.getLettreMotivationUrl() != null ? "/api/demandes/" + d.getId() + "/lettre" : null)
                .motivation(d.getMotivation())
                .dateSoumission(d.getDateSoumission())
                .statut(d.getStatut())
                .dateDecision(d.getDateDecision())
                .motifRefus(d.getMotifRefus())
                .decideurNom(d.getDecideur() != null ? d.getDecideur().getPrenom() + " " + d.getDecideur().getNom() : null)
                .membreCreeId(d.getMembreCree() != null ? d.getMembreCree().getId() : null)
                .build();
    }
}

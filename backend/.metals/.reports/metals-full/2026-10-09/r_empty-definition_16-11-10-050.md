error id: file:///C:/Users/moham/Documents/JEE/lias/backend/src/main/java/ma/univh2c/fsbm/lias/service/MembreService.java:jakarta/persistence/criteria/Predicate#
file:///C:/Users/moham/Documents/JEE/lias/backend/src/main/java/ma/univh2c/fsbm/lias/service/MembreService.java
empty definition using pc, found symbol in pc: jakarta/persistence/criteria/Predicate#
empty definition using semanticdb
empty definition using fallback
non-local guesses:

offset: 13593
uri: file:///C:/Users/moham/Documents/JEE/lias/backend/src/main/java/ma/univh2c/fsbm/lias/service/MembreService.java
text:
```scala
package ma.univh2c.fsbm.lias.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import ma.univh2c.fsbm.lias.aspect.Audite;
import ma.univh2c.fsbm.lias.dto.*;
import ma.univh2c.fsbm.lias.entity.*;
import ma.univh2c.fsbm.lias.enums.*;
import ma.univh2c.fsbm.lias.exception.ConflitEtatException;
import ma.univh2c.fsbm.lias.exception.RessourceIntrouvableException;
import ma.univh2c.fsbm.lias.mapper.MembreMapper;
import ma.univh2c.fsbm.lias.repository.*;
import ma.univh2c.fsbm.lias.security.MembreDetails;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MembreService {

    private final MembreRepository membreRepository;
    private final HistoriqueProfilRepository historiqueProfilRepository;
    private final HistoriqueStatutRepository historiqueStatutRepository;
    private final JetonSecuriteRepository jetonSecuriteRepository;
    private final PeriodeAffiliationRepository periodeAffiliationRepository;
    private final AffectationRoleRepository affectationRoleRepository;
    private final MandatRepository mandatRepository;
    private final EquipeRepository equipeRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final MembreMapper membreMapper;
    private final ObjectMapper objectMapper;

    public List<MembreInterneDTO> listerMembres() {
        return membreMapper.toInterneDtoList(membreRepository.findAll());
    }

    public MembreInterneDTO getMembreParId(Long id) {
        Membre membre = membreRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Membre introuvable"));
        return membreMapper.toInterneDto(membre);
    }

    public MembreProfilDTO getMonProfil() {
        return membreMapper.toProfilDto(getMembreConnecte());
    }

    @Transactional
    public MembreProfilDTO modifierMonProfil(MembreModificationRequest request) {
        Membre membre = getMembreConnecte();

        if (!membre.getEmail().equalsIgnoreCase(request.getEmail()) && 
            membreRepository.existsByEmail(request.getEmail())) {
            throw new ConflitEtatException("EMAIL_DEJA_UTILISE", "Cet email est déjà utilisé par un autre compte");
        }

        try {
            String profilJson = objectMapper.writeValueAsString(membreMapper.toProfilDto(membre));
            HistoriqueProfil historique = HistoriqueProfil.builder()
                    .dateModification(LocalDateTime.now())
                    .donneesModifiees(profilJson)
                    .membre(membre)
                    .build();
            historiqueProfilRepository.save(historique);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Erreur lors de l'historisation du profil", e);
        }

        membreMapper.updateEntityFromModificationRequest(request, membre);
        return membreMapper.toProfilDto(membreRepository.save(membre));
    }

    @Transactional
    @Audite(action = TypeAction.MODIFICATION, entite = "Membre")
    public void changerStatut(Long id, StatutMembre nouveauStatut) {
        Membre membre = membreRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Membre introuvable"));

        if (membre.getEtatCompte() != EtatCompte.ACTIF) {
            throw new ConflitEtatException("COMPTE_INACTIF", "Impossible de changer le statut d'un compte inactif");
        }
        if (membre.getStatut() == nouveauStatut) {
            throw new ConflitEtatException("STATUT_IDENTIQUE", "Le membre possède déjà ce statut");
        }

        HistoriqueStatut historique = HistoriqueStatut.builder()
                .ancienStatut(membre.getStatut())
                .nouveauStatut(nouveauStatut)
                .dateChangement(LocalDate.now())
                .membre(membre)
                .build();
        historiqueStatutRepository.save(historique);

        membre.setStatut(nouveauStatut);
        membreRepository.save(membre);
    }

    @Transactional
    @Audite(action = TypeAction.DESACTIVATION, entite = "Membre")
    public void mettreALaRetraite(Long id, LocalDate dateRetraite) {
        Membre membre = membreRepository.findById(id).orElseThrow(() -> new RessourceIntrouvableException("Membre introuvable"));
        if (membre.getEtatCompte() != EtatCompte.ACTIF) throw new ConflitEtatException("COMPTE_DEJA_INACTIF", "Le compte n'est pas actif");

        cloturerPériodesEtMandats(membre, dateRetraite);
        membre.setEtatCompte(EtatCompte.GELE);
        membre.setDateRetraite(dateRetraite);
        
        jetonSecuriteRepository.revoquerTokensRefreshPourMembre(membre.getId());
        membreRepository.save(membre);
    }

    @Transactional
    @Audite(action = TypeAction.DESACTIVATION, entite = "Membre")
    public void declarerDepart(Long id, LocalDate dateDepart) {
        Membre membre = membreRepository.findById(id).orElseThrow(() -> new RessourceIntrouvableException("Membre introuvable"));
        if (membre.getEtatCompte() != EtatCompte.ACTIF) throw new ConflitEtatException("COMPTE_DEJA_INACTIF", "Le compte n'est pas actif");

        cloturerPériodesEtMandats(membre, dateDepart);
        membre.setEtatCompte(EtatCompte.DESACTIVE);
        membre.setDateDepart(dateDepart);
        
        jetonSecuriteRepository.revoquerTokensRefreshPourMembre(membre.getId());
        membreRepository.save(membre);
    }

    private void cloturerPériodesEtMandats(Membre membre, LocalDate dateCloture) {
        membre.getPeriodesAffiliation().stream().filter(p -> p.getDateFin() == null).forEach(p -> p.setDateFin(dateCloture));
        membre.getMandats().stream().filter(m -> m.getDateFin() == null).forEach(m -> m.setDateFin(dateCloture));
        membre.getAffectationsRole().stream().filter(a -> a.getDateFin() == null).forEach(a -> a.setDateFin(dateCloture));
    }

    @Transactional
    @Audite(action = TypeAction.REACTIVATION, entite = "Membre")
    public void reactiverCompte(Long id, LocalDate dateRetour) {
        Membre membre = membreRepository.findById(id).orElseThrow(() -> new RessourceIntrouvableException("Membre introuvable"));
        if (membre.getEtatCompte() == EtatCompte.GELE) throw new ConflitEtatException("REACTIVATION_RETRAITE_INTERDITE", "Impossible de réactiver un retraité");
        if (membre.getEtatCompte() == EtatCompte.ACTIF) throw new ConflitEtatException("DEJA_ACTIF", "Le compte est déjà actif");

        PeriodeAffiliation nouvellePeriode = PeriodeAffiliation.builder()
                .dateDebut(dateRetour).membre(membre).build();
        periodeAffiliationRepository.save(nouvellePeriode);

        membre.setEtatCompte(EtatCompte.ACTIF);
        membre.setDateDepart(null);
        membreRepository.save(membre);
    }

    public HistoriqueMembreDTO getHistoriqueMembre(Long id) {
        Membre membre = membreRepository.findById(id).orElseThrow(() -> new RessourceIntrouvableException("Membre introuvable"));
        List<HistoriqueMembreDTO.EntreeHistorique> entrees = new ArrayList<>();

        membre.getPeriodesAffiliation().forEach(p -> {
            entrees.add(HistoriqueMembreDTO.EntreeHistorique.builder().date(p.getDateDebut()).type(TypeEntreeHistorique.AFFILIATION_DEBUT).libelle("Début d'affiliation").build());
            if (p.getDateFin() != null) entrees.add(HistoriqueMembreDTO.EntreeHistorique.builder().date(p.getDateFin()).type(TypeEntreeHistorique.AFFILIATION_FIN).libelle("Fin d'affiliation").build());
        });

        membre.getHistoriquesStatut().forEach(s -> entrees.add(HistoriqueMembreDTO.EntreeHistorique.builder().date(s.getDateChangement()).type(TypeEntreeHistorique.CHANGEMENT_STATUT).libelle("Passage de " + s.getAncienStatut() + " à " + s.getNouveauStatut()).build()));

        membre.getMandats().forEach(m -> {
            entrees.add(HistoriqueMembreDTO.EntreeHistorique.builder().date(m.getDateDebut()).type(TypeEntreeHistorique.MANDAT_DEBUT).libelle("Mandat " + m.getTypeMandat() + (m.getEquipe() != null ? " (" + m.getEquipe().getNom() + ")" : "")).build());
            if (m.getDateFin() != null) entrees.add(HistoriqueMembreDTO.EntreeHistorique.builder().date(m.getDateFin()).type(TypeEntreeHistorique.MANDAT_FIN).libelle("Fin mandat " + m.getTypeMandat()).build());
        });

        membre.getAffectationsRole().forEach(a -> {
            entrees.add(HistoriqueMembreDTO.EntreeHistorique.builder().date(a.getDateDebut()).type(TypeEntreeHistorique.ROLE_DEBUT).libelle("Affecté à l'équipe : " + a.getEquipe().getNom()).build());
            if (a.getDateFin() != null) entrees.add(HistoriqueMembreDTO.EntreeHistorique.builder().date(a.getDateFin()).type(TypeEntreeHistorique.ROLE_FIN).libelle("Fin affectation équipe : " + a.getEquipe().getNom()).build());
        });

        entrees.sort(Comparator.comparing(HistoriqueMembreDTO.EntreeHistorique::getDate));
        return HistoriqueMembreDTO.builder().membreId(id).entrees(entrees).build();
    }

    @Transactional
    @Audite(action = TypeAction.MODIFICATION, entite = "Membre")
    public void affecterEquipe(Long id, AffectationEquipeRequest request) {
        Membre membre = membreRepository.findById(id).orElseThrow(() -> new RessourceIntrouvableException("Membre introuvable"));
        Equipe equipe = equipeRepository.findById(request.getEquipeId()).orElseThrow(() -> new RessourceIntrouvableException("Équipe introuvable"));

        if (membre.getEquipeActuelle() != null && membre.getEquipeActuelle().getId().equals(equipe.getId())) {
            throw new ConflitEtatException("MEME_EQUIPE", "Le membre est déjà dans cette équipe");
        }

        affectationRoleRepository.findAffectationActiveParMembre(id).ifPresent(a -> {
            a.setDateFin(LocalDate.now());
            affectationRoleRepository.save(a);
        });

        AffectationRole nouvelleAffectation = new AffectationRole();
        nouvelleAffectation.setMembre(membre);
        nouvelleAffectation.setEquipe(equipe);
        nouvelleAffectation.setTypeRole(TypeRole.MEMBRE_EQUIPE);
        nouvelleAffectation.setDateDebut(LocalDate.now());
        affectationRoleRepository.save(nouvelleAffectation);

        membre.setEquipeActuelle(equipe);
        membreRepository.save(membre);
    }

    @Transactional
    @Audite(action = TypeAction.CREATION, entite = "Mandat")
    public void promouvoirChefEquipe(Long id, PromotionRequest request) {
        Membre membre = membreRepository.findById(id).orElseThrow(() -> new RessourceIntrouvableException("Membre introuvable"));
        Equipe equipe = equipeRepository.findById(request.getEquipeId()).orElseThrow(() -> new RessourceIntrouvableException("Équipe introuvable"));

        if (membre.getEquipeActuelle() == null || !membre.getEquipeActuelle().getId().equals(equipe.getId())) {
            throw new ConflitEtatException("MEMBRE_HORS_EQUIPE", "Le membre doit d'abord être affecté à cette équipe");
        }

        mandatRepository.findChefEquipeActif(equipe.getId()).ifPresent(ancienChef -> {
            ancienChef.setDateFin(LocalDate.now());
            mandatRepository.save(ancienChef);
        });

        affectationRoleRepository.findAffectationActiveParMembre(id).ifPresent(a -> {
            a.setDateFin(LocalDate.now());
            affectationRoleRepository.save(a);
        });

        Mandat nouveauMandat = new Mandat();
        nouveauMandat.setMembre(membre);
        nouveauMandat.setTypeMandat(TypeMandat.CHEF_EQUIPE);
        nouveauMandat.setEquipe(equipe);
        nouveauMandat.setDateDebut(LocalDate.now());
        mandatRepository.save(nouveauMandat);
    }

    @Transactional
    public void renvoyerAcces(Long id) {
        Membre membre = membreRepository.findById(id).orElseThrow(() -> new RessourceIntrouvableException("Membre introuvable"));
        String motDePasseTemp = UUID.randomUUID().toString().substring(0, 8);
        membre.setMotDePasse(passwordEncoder.encode(motDePasseTemp));
        membre.setDoitChangerMotDePasse(true);
        membreRepository.save(membre);
        emailService.envoyerAccesCandidat(membre.getEmail(), motDePasseTemp);
    }

    private Membre getMembreConnecte() {
        MembreDetails details = (MembreDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return details.getMembre();
    }

    public org.springframework.data.domain.Page<Membre> listerComptesPourAdmin(
            StatutMembre statut, 
            EtatCompte etatCompte, 
            org.springframework.data.domain.Pageable pageable) {
            
        org.springframework.data.jpa.domain.Specification<Membre> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate@@> predicates = new ArrayList<>();

            if (statut != null) {
                predicates.add(cb.equal(root.get("statut"), statut));
            }

            if (etatCompte != null) {
                predicates.add(cb.equal(root.get("etatCompte"), etatCompte));
            }

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        return membreRepository.findAll(spec, pageable);
    }
}
```


#### Short summary: 

empty definition using pc, found symbol in pc: jakarta/persistence/criteria/Predicate#
error id: file:///C:/Users/moham/Documents/Master/JEE/lias/backend/src/main/java/ma/univh2c/fsbm/lias/service/MaterielService.java:_empty_/MembreDetails#
file:///C:/Users/moham/Documents/Master/JEE/lias/backend/src/main/java/ma/univh2c/fsbm/lias/service/MaterielService.java
empty definition using pc, found symbol in pc: _empty_/MembreDetails#
empty definition using semanticdb
empty definition using fallback
non-local guesses:

offset: 2509
uri: file:///C:/Users/moham/Documents/Master/JEE/lias/backend/src/main/java/ma/univh2c/fsbm/lias/service/MaterielService.java
text:
```scala
package ma.univh2c.fsbm.lias.service;

import lombok.RequiredArgsConstructor;
import ma.univh2c.fsbm.lias.dto.*;
import ma.univh2c.fsbm.lias.entity.AttributionMateriel;
import ma.univh2c.fsbm.lias.entity.DemandeMateriel;
import ma.univh2c.fsbm.lias.entity.Materiel;
import ma.univh2c.fsbm.lias.entity.Membre;
import ma.univh2c.fsbm.lias.enums.EtatCompte;
import ma.univh2c.fsbm.lias.enums.StatutDemandeMateriel;
import ma.univh2c.fsbm.lias.enums.StatutMateriel;
import ma.univh2c.fsbm.lias.exception.ConflitEtatException;
import ma.univh2c.fsbm.lias.exception.RessourceIntrouvableException;
import ma.univh2c.fsbm.lias.event.DecisionMaterielEvent;
import ma.univh2c.fsbm.lias.mapper.MaterielMapper;
import ma.univh2c.fsbm.lias.repository.AttributionMaterielRepository;
import ma.univh2c.fsbm.lias.repository.DemandeMaterielRepository;
import ma.univh2c.fsbm.lias.repository.MaterielRepository;
import ma.univh2c.fsbm.lias.repository.MembreRepository;
import ma.univh2c.fsbm.lias.security.MembreDetails;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.Pageable;
import jakarta.persistence.criteria.Predicate;

@Service
@RequiredArgsConstructor
public class MaterielService {

    private final MaterielRepository materielRepository;
    private final DemandeMaterielRepository demandeRepository;
    private final AttributionMaterielRepository attributionRepository;
    private final MaterielMapper mapper;
    private final MembreRepository membreRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final ma.univh2c.fsbm.lias.mapper.MembreMapper membreMapper;

    public List<MaterielDTO> listerStock() {
        return mapper.toDtoList(materielRepository.findAll());
    }

    public List<AttributionMaterielDTO> listerAttributions() {
        return mapper.toAttributionDtoList(attributionRepository.findAllByOrderByDateDistributionDescIdDesc());
    }

    public List<DemandeMaterielDTO> listerDemandes() {
        MembreDetails details = (MembreDet@@ails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        boolean isDirection = details.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_DIRECTEUR")
 a.getAuthority().equals("ROLE_VICE_DIRECTEUR"));

        if (isDirection) {
            return mapper.toDemandeDtoList(demandeRepository.findAll());
        }

        return mapper.toDemandeDtoList(
                demandeRepository.findAll().stream()
                        .filter(d -> d.getMembre().getId().equals(details.getMembre().getId()))
                        .toList());
    }

    @Transactional
    public DemandeMaterielDTO soumettreDemande(DemandeMaterielRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isDirector = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_DIRECTEUR"));
        if (isDirector) {
            throw new ConflitEtatException("AUTO_VALIDATION_INTERDITE",
                    "Le Directeur ne peut pas soumettre de demande de matériel via le système (RG-08).");
        }

        Membre membre = getMembreConnecte();

        DemandeMateriel demande = new DemandeMateriel();
        demande.setDescriptionBesoin(request.getDescriptionBesoin());
        demande.setQuantite(request.getQuantite());
        demande.setDateSoumission(LocalDateTime.now());
        demande.setStatut(StatutDemandeMateriel.EN_ATTENTE);
        demande.setMembre(membre);

        demande = demandeRepository.save(demande);
        eventPublisher.publishEvent(new ma.univh2c.fsbm.lias.event.DemandeMaterielSoumiseEvent(demande));
        return mapper.toDemandeDto(demande);
    }

    @Transactional
    public void validerDemande(Long id, DecisionMaterielRequest request) {
        DemandeMateriel demande = demandeRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Demande introuvable"));

        if (demande.getStatut() != StatutDemandeMateriel.EN_ATTENTE) {
            throw new ConflitEtatException("DEMANDE_TRAITEE", "La demande a déjà été traitée");
        }

        if (request.getMaterielId() == null) {
            throw new ConflitEtatException("MATERIEL_REQUIS", "Vous devez spécifier quel matériel est attribué");
        }

        Materiel materiel = materielRepository.findById(request.getMaterielId())
                .orElseThrow(() -> new RessourceIntrouvableException("Matériel introuvable dans le stock"));

        if (materiel.getQuantiteDisponible() < demande.getQuantite()) {
            throw new ConflitEtatException("STOCK_INSUFFISANT", "La quantité disponible en stock est insuffisante");
        }

        // Le verrouillage optimiste (@Version) protège cette soustraction
        materiel.setQuantiteDisponible(materiel.getQuantiteDisponible() - demande.getQuantite());
        if (materiel.getQuantiteDisponible() == 0) {
            materiel.setStatut(StatutMateriel.DISTRIBUE);
        }
        materielRepository.save(materiel);

        AttributionMateriel attribution = AttributionMateriel.builder()
                .dateDistribution(LocalDate.now())
                .quantiteAttribuee(demande.getQuantite())
                .materiel(materiel)
                .membre(demande.getMembre())
                .build();
        attributionRepository.save(attribution);

        demande.setStatut(StatutDemandeMateriel.VALIDEE);
        demande.setDateTraitement(LocalDateTime.now());
        demande.setAttribution(attribution);
        demande.setCommentaireDirection(request.getCommentaire());

        demandeRepository.save(demande);
        eventPublisher.publishEvent(new DecisionMaterielEvent(demande));
    }

    @Transactional
    public void refuserDemande(Long id, DecisionMaterielRequest request) {
        DemandeMateriel demande = demandeRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Demande introuvable"));

        if (demande.getStatut() != StatutDemandeMateriel.EN_ATTENTE) {
            throw new ConflitEtatException("DEMANDE_TRAITEE", "La demande a déjà été traitée");
        }

        if (request.getCommentaire() == null || request.getCommentaire().isBlank()) {
            throw new ConflitEtatException("COMMENTAIRE_REQUIS", "Un motif de refus est obligatoire.");
        }

        demande.setStatut(StatutDemandeMateriel.REFUSEE);
        demande.setDateTraitement(LocalDateTime.now());
        demande.setCommentaireDirection(request.getCommentaire());
        demandeRepository.save(demande);
        eventPublisher.publishEvent(new DecisionMaterielEvent(demande));
    }

    private Membre getMembreConnecte() {
        MembreDetails details = (MembreDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return details.getMembre();
    }

    public List<MembreInterneDTO> getMembresNonEquipes() {
        // En supposant que l'injection MembreMapper et MembreRepository est présente ou
        // ajoutée
        return membreRepository.findMembresActifsNonEquipes().stream()
                .map(m -> new MembreInterneDTO()) // Remplacer par mapper.toInterneDto(m) si disponible
                .toList();
    }

    @Transactional
    public void attribuerMaterielDirectement(AttributionRequest request) {
        Materiel materiel = materielRepository.findById(request.getMaterielId())
                .orElseThrow(() -> new RessourceIntrouvableException("Matériel introuvable"));

        // MembreRepository doit être injecté dans ce service
        Membre membre = membreRepository.findById(request.getMembreId())
                .orElseThrow(() -> new RessourceIntrouvableException("Membre introuvable"));

        if (membre.getEtatCompte() != EtatCompte.ACTIF) {
            throw new ConflitEtatException("BENEFICIAIRE_INACTIF", "Le membre n'est pas actif");
        }
        if (materiel.getQuantiteDisponible() < request.getQuantite()) {
            throw new ConflitEtatException("STOCK_INSUFFISANT", "Stock insuffisant");
        }

        materiel.setQuantiteDisponible(materiel.getQuantiteDisponible() - request.getQuantite());
        if (materiel.getQuantiteDisponible() == 0) {
            materiel.setStatut(StatutMateriel.DISTRIBUE);
        }
        materielRepository.save(materiel);

        AttributionMateriel attribution = AttributionMateriel.builder()
                .dateDistribution(LocalDate.now())
                .quantiteAttribuee(request.getQuantite())
                .materiel(materiel)
                .membre(membre)
                .build();
        attributionRepository.save(attribution);
    }

    @Transactional
    @ma.univh2c.fsbm.lias.aspect.Audite(action = ma.univh2c.fsbm.lias.enums.TypeAction.CREATION, entite = "Materiel")
    public MaterielDTO declarerArrivage(MaterielRequest request) {
        Materiel materiel = new Materiel();
        materiel.setDesignation(request.getDesignation());
        materiel.setDateArrivage(request.getDateArrivage());
        materiel.setQuantiteInitiale(request.getQuantiteInitiale());
        materiel.setQuantiteDisponible(request.getQuantiteInitiale());
        materiel.setStatut(StatutMateriel.EN_STOCK);

        return mapper.toDto(materielRepository.save(materiel));
    }

    public PageDTO<DemandeMaterielDTO> rechercherDemandes(StatutDemandeMateriel statut, Pageable pageable) {
        Specification<DemandeMateriel> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (statut != null) {
                predicates.add(cb.equal(root.get("statut"), statut));
            }

            MembreDetails details = (MembreDetails) SecurityContextHolder.getContext().getAuthentication()
                    .getPrincipal();
            boolean isDirection = details.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_DIRECTEUR")
 a.getAuthority().equals("ROLE_VICE_DIRECTEUR"));

            if (!isDirection) {
                predicates.add(cb.equal(root.get("membre").get("id"), details.getMembre().getId()));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return PageDTO.of(demandeRepository.findAll(spec, pageable), mapper::toDemandeDto);
    }
}
```


#### Short summary: 

empty definition using pc, found symbol in pc: _empty_/MembreDetails#
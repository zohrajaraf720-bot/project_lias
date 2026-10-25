package ma.univh2c.fsbm.lias.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.univh2c.fsbm.lias.dto.*;
import ma.univh2c.fsbm.lias.entity.*;
import ma.univh2c.fsbm.lias.enums.EtatCompte;
import ma.univh2c.fsbm.lias.enums.StatutDemandeMateriel;
import ma.univh2c.fsbm.lias.enums.StatutMateriel;
import ma.univh2c.fsbm.lias.enums.TypeMandat;
import ma.univh2c.fsbm.lias.enums.TypeNotification;
import ma.univh2c.fsbm.lias.exception.ConflitEtatException;
import ma.univh2c.fsbm.lias.exception.RegleMetierException;
import ma.univh2c.fsbm.lias.exception.RessourceIntrouvableException;
import ma.univh2c.fsbm.lias.repository.*;
import ma.univh2c.fsbm.lias.security.SecurityService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MaterielService {

    private final MaterielRepository materielRepository;
    private final AttributionMaterielRepository attributionRepository;
    private final DemandeMaterielRepository demandeRepository;
    private final MembreRepository membreRepository;
    private final MandatRepository mandatRepository;
    private final NotificationService notificationService;
    private final SecurityService securityService;
    private final MembreService membreService;
    private final EquipeRepository equipeRepository;

    @Transactional
    public MaterielDTO declarerArrivage(MaterielRequest request) {
        Materiel m = Materiel.builder()
                .designation(request.getDesignation().trim())
                .dateArrivage(request.getDateArrivage())
                .quantiteInitiale(request.getQuantiteInitiale())
                .quantiteDisponible(request.getQuantiteInitiale())
                .statut(StatutMateriel.EN_STOCK)
                .build();

        Materiel saved = materielRepository.save(m);
        return convertirEnDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<MaterielDTO> listerStock() {
        return materielRepository.findAll().stream()
                .map(this::convertirEnDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DemandeMaterielDTO> listerDemandes() {
        Long currentId = securityService.getIdUtilisateurConnecte();
        if (securityService.estDirection()) {
            return demandeRepository.findAll().stream()
                    .map(this::convertirDemandeEnDTO)
                    .collect(Collectors.toList());
        }
        return demandeRepository.findByDemandeurId(currentId).stream()
                .map(this::convertirDemandeEnDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PageDTO<DemandeMaterielDTO> rechercherDemandes(StatutDemandeMateriel statut, Pageable pageable) {
        Page<DemandeMateriel> page = (statut != null)
                ? demandeRepository.findByStatut(statut, pageable)
                : demandeRepository.findAll(pageable);
        return PageDTO.from(page, page.getContent().stream().map(this::convertirDemandeEnDTO).collect(Collectors.toList()));
    }

    @Transactional
    public DemandeMaterielDTO soumettreDemande(DemandeMaterielRequest request) {
        Long currentId = securityService.getIdUtilisateurConnecte();
        Membre demandeur = (currentId != null) ? membreRepository.findById(currentId).orElse(null) : null;
        if (demandeur == null) throw new RegleMetierException("Utilisateur non authentifié");

        DemandeMateriel dm = DemandeMateriel.builder()
                .descriptionBesoin(request.getDescriptionBesoin().trim())
                .quantite(request.getQuantite())
                .dateSoumission(LocalDateTime.now())
                .statut(StatutDemandeMateriel.EN_ATTENTE)
                .demandeur(demandeur)
                .build();

        DemandeMateriel saved = demandeRepository.save(dm);

        // Notifier la Direction
        mandatRepository.findByTypeMandatAndDateFinIsNull(TypeMandat.DIRECTEUR).forEach(m -> {
            if (m.estActif()) {
                notificationService.creerNotification(
                        m.getMembre(),
                        "Nouveau besoin en matériel",
                        "Demande de " + saved.getQuantite() + " x " + saved.getDescriptionBesoin() + " par " + demandeur.getPrenom() + " " + demandeur.getNom(),
                        TypeNotification.VALIDATION_DEMANDE,
                        "/direction/materiel"
                );
            }
        });

        return convertirDemandeEnDTO(saved);
    }

    @Transactional
    public void validerDemande(Long id, DecisionMaterielRequest request) {
        DemandeMateriel dm = demandeRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Demande de matériel introuvable"));

        if (request != null && request.getMaterielId() != null) {
            attribuerMaterielDirectement(AttributionRequest.builder()
                    .materielId(request.getMaterielId())
                    .membreId(dm.getDemandeur().getId())
                    .quantite(dm.getQuantite())
                    .demandeId(dm.getId())
                    .build());
        } else {
            dm.valider();
        }

        if (request != null && request.getCommentaire() != null) {
            dm.setCommentaireDirection(request.getCommentaire());
        }
        demandeRepository.save(dm);

        notificationService.creerNotification(
                dm.getDemandeur(),
                "Demande de matériel validée",
                "Votre demande de matériel (" + dm.getDescriptionBesoin() + ") a été validée par la Direction.",
                TypeNotification.MATERIEL,
                "/mes-demandes-materiel"
        );
    }

    @Transactional
    public void retournerMateriel(Long id) {
        DemandeMateriel dm = demandeRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Demande de matériel introuvable"));

        dm.setStatut(StatutDemandeMateriel.RETOURNEE);
        demandeRepository.save(dm);

        notificationService.notifierDirection(
                "Restitution de matériel",
                "Le matériel '" + dm.getDescriptionBesoin() + "' emprunté par " + dm.getDemandeur().getPrenom() + " " + dm.getDemandeur().getNom() + " a été restitué.",
                TypeNotification.MATERIEL,
                "/gouvernance/materiel"
        );

        if (dm.getAttribution() != null) {
            AttributionMateriel attr = dm.getAttribution();
            attr.setDateRetour(LocalDate.now());
            attributionRepository.save(attr);

            Materiel mat = attr.getMateriel();
            if (mat != null) {
                int dispo = mat.getQuantiteDisponible() + attr.getQuantiteAttribuee();
                mat.setQuantiteDisponible(dispo);
                if (dispo > 0) {
                    mat.setStatut(StatutMateriel.EN_STOCK);
                }
                materielRepository.save(mat);
            }
        }
    }

    @Transactional
    public void refuserDemande(Long id, DecisionMaterielRequest request) {
        DemandeMateriel dm = demandeRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Demande de matériel introuvable"));

        String motif = (request != null && request.getCommentaire() != null) ? request.getCommentaire() : "";
        if (motif.isBlank()) {
            throw new RegleMetierException("Un motif est obligatoire pour refuser une demande de matériel");
        }

        dm.refuser(motif);
        demandeRepository.save(dm);

        notificationService.creerNotification(
                dm.getDemandeur(),
                "Demande de matériel refusée",
                "Votre demande de matériel (" + dm.getDescriptionBesoin() + ") a été refusée. Motif : " + motif,
                TypeNotification.VALIDATION_DEMANDE,
                "/mes-demandes-materiel"
        );
    }

    @Transactional(readOnly = true)
    public List<MembreInterneDTO> getMembresNonEquipes() {
        return membreRepository.findMembresNonEquipes().stream()
                .map(membreService::convertirEnInterneDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void attribuerMaterielDirectement(AttributionRequest request) {
        Materiel mat = materielRepository.findByIdForUpdate(request.getMaterielId())
                .orElseThrow(() -> new RessourceIntrouvableException("Matériel introuvable"));

        if (mat.getQuantiteDisponible() < request.getQuantite()) {
            throw new ConflitEtatException("Quantité disponible insuffisante (reste : " + mat.getQuantiteDisponible() + ")");
        }

        Membre membre = membreRepository.findById(request.getMembreId())
                .orElseThrow(() -> new RessourceIntrouvableException("Membre bénéficiaire introuvable"));

        // Décrémenter le stock
        int nouveauReste = mat.getQuantiteDisponible() - request.getQuantite();
        mat.setQuantiteDisponible(nouveauReste);
        if (nouveauReste == 0) {
            mat.setStatut(StatutMateriel.DISTRIBUE);
        }
        materielRepository.save(mat);

        AttributionMateriel attr = AttributionMateriel.builder()
                .materiel(mat)
                .membre(membre)
                .quantiteAttribuee(request.getQuantite())
                .dateDistribution(LocalDate.now())
                .build();
        AttributionMateriel savedAttr = attributionRepository.save(attr);

        // Si la distribution répond à une demande spécifique
        if (request.getDemandeId() != null) {
            demandeRepository.findById(request.getDemandeId()).ifPresent(dm -> {
                dm.valider();
                dm.setAttribution(savedAttr);
                demandeRepository.save(dm);
            });
        }

        notificationService.creerNotification(
                membre,
                "Attribution de matériel",
                "Vous avez reçu : " + request.getQuantite() + " x " + mat.getDesignation(),
                TypeNotification.VALIDATION_DEMANDE,
                "/mes-demandes-materiel"
        );
    }

    @Transactional
    public int distribuerMaterielGroupe(DistributionMaterielGroupeRequest request) {
        if (request.getMaterielId() == null) {
            throw new RegleMetierException("Veuillez sélectionner un équipement à distribuer.");
        }
        int quantiteParMembre = (request.getQuantiteParMembre() != null && request.getQuantiteParMembre() > 0)
                ? request.getQuantiteParMembre() : 1;

        List<Membre> destinataires;
        if ("EQUIPE".equalsIgnoreCase(request.getMode()) && request.getEquipeId() != null) {
            Equipe equipe = equipeRepository.findById(request.getEquipeId())
                    .orElseThrow(() -> new RessourceIntrouvableException("Équipe introuvable"));
            destinataires = equipe.getMembres().stream()
                    .filter(m -> m.getEtatCompte() == EtatCompte.ACTIF)
                    .collect(Collectors.toList());
            if (destinataires.isEmpty()) {
                throw new RegleMetierException("Aucun membre actif trouvé dans l'équipe " + equipe.getNom());
            }
        } else if (request.getMembreIds() != null && !request.getMembreIds().isEmpty()) {
            destinataires = membreRepository.findAllById(request.getMembreIds()).stream()
                    .filter(m -> m.getEtatCompte() == EtatCompte.ACTIF)
                    .collect(Collectors.toList());
            if (destinataires.isEmpty()) {
                throw new RegleMetierException("Aucun membre actif sélectionné.");
            }
        } else {
            throw new RegleMetierException("Veuillez sélectionner au moins un membre ou une équipe bénéficiaire.");
        }

        int totalRequis = destinataires.size() * quantiteParMembre;

        Materiel mat = materielRepository.findByIdForUpdate(request.getMaterielId())
                .orElseThrow(() -> new RessourceIntrouvableException("Matériel introuvable"));

        if (mat.getQuantiteDisponible() < totalRequis) {
            throw new ConflitEtatException("Stock disponible insuffisant : requis " + totalRequis + " unité(s) ("
                    + destinataires.size() + " membre(s) x " + quantiteParMembre + "), en stock : " + mat.getQuantiteDisponible());
        }

        // Décrémenter le stock du matériel
        int dispoRestante = mat.getQuantiteDisponible() - totalRequis;
        mat.setQuantiteDisponible(dispoRestante);
        if (dispoRestante == 0) {
            mat.setStatut(StatutMateriel.DISTRIBUE);
        }
        materielRepository.save(mat);

        String motif = (request.getMotif() != null && !request.getMotif().isBlank())
                ? request.getMotif().trim()
                : "Dotation directe par la Direction";

        for (Membre m : destinataires) {
            // Créer l'attribution
            AttributionMateriel attr = AttributionMateriel.builder()
                    .materiel(mat)
                    .membre(m)
                    .quantiteAttribuee(quantiteParMembre)
                    .dateDistribution(LocalDate.now())
                    .build();
            AttributionMateriel savedAttr = attributionRepository.save(attr);

            // Créer la demande associée en statut VALIDEE pour la traçabilité et l'enregistrement du retour
            DemandeMateriel dm = DemandeMateriel.builder()
                    .demandeur(m)
                    .descriptionBesoin(motif)
                    .quantite(quantiteParMembre)
                    .dateSoumission(LocalDateTime.now())
                    .dateTraitement(LocalDateTime.now())
                    .statut(StatutDemandeMateriel.VALIDEE)
                    .commentaireDirection("Dotation directe Direction : " + mat.getDesignation() + " (" + quantiteParMembre + ")")
                    .attribution(savedAttr)
                    .build();
            demandeRepository.save(dm);

            // Notification envoyée au membre
            notificationService.creerNotification(
                    m,
                    "Dotation de matériel",
                    "La Direction vous a doté de : " + quantiteParMembre + " x " + mat.getDesignation() + " (" + motif + ")",
                    TypeNotification.VALIDATION_DEMANDE,
                    "/mes-demandes-materiel"
            );
        }

        log.info("Dotation directe effectuée : {} membre(s) ont reçu {} x {}", destinataires.size(), quantiteParMembre, mat.getDesignation());
        return destinataires.size();
    }

    @Transactional(readOnly = true)
    public List<AttributionMaterielDTO> listerAttributions() {
        return attributionRepository.findAllByOrderByDateDistributionDesc().stream()
                .map(this::convertirAttributionEnDTO)
                .collect(Collectors.toList());
    }

    public MaterielDTO convertirEnDTO(Materiel m) {
        return MaterielDTO.builder()
                .id(m.getId())
                .designation(m.getDesignation())
                .dateArrivage(m.getDateArrivage())
                .quantiteInitiale(m.getQuantiteInitiale())
                .quantiteDisponible(m.getQuantiteDisponible())
                .statut(m.getStatut())
                .build();
    }

    public DemandeMaterielDTO convertirDemandeEnDTO(DemandeMateriel dm) {
        String matAttrib = (dm.getAttribution() != null && dm.getAttribution().getMateriel() != null)
                ? dm.getAttribution().getMateriel().getDesignation() + " (" + dm.getAttribution().getQuantiteAttribuee() + ")"
                : null;

        return DemandeMaterielDTO.builder()
                .id(dm.getId())
                .descriptionBesoin(dm.getDescriptionBesoin())
                .quantite(dm.getQuantite())
                .dateSoumission(dm.getDateSoumission())
                .dateTraitement(dm.getDateTraitement())
                .statut(dm.getStatut())
                .commentaireDirection(dm.getCommentaireDirection())
                .demandeur(membreService.convertirEnResumeDTO(dm.getDemandeur()))
                .materielAttribue(matAttrib)
                .build();
    }

    public AttributionMaterielDTO convertirAttributionEnDTO(AttributionMateriel a) {
        return AttributionMaterielDTO.builder()
                .id(a.getId())
                .materielId(a.getMateriel().getId())
                .materielDesignation(a.getMateriel().getDesignation())
                .beneficiaire(membreService.convertirEnResumeDTO(a.getMembre()))
                .dateDistribution(a.getDateDistribution())
                .dateRetour(a.getDateRetour())
                .quantiteAttribuee(a.getQuantiteAttribuee())
                .build();
    }
}

package ma.univh2c.fsbm.lias.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.univh2c.fsbm.lias.dto.IndicateursDirectionDTO;
import ma.univh2c.fsbm.lias.dto.TableauBordMembreDTO;
import ma.univh2c.fsbm.lias.enums.StatutDemande;
import ma.univh2c.fsbm.lias.enums.StatutDemandeMateriel;
import ma.univh2c.fsbm.lias.enums.StatutValidationEvenement;
import ma.univh2c.fsbm.lias.repository.*;
import ma.univh2c.fsbm.lias.security.SecurityService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Slf4j
public class TableauBordService {

    private final DemandeAdhesionRepository demandeAdhesionRepository;
    private final DemandeMaterielRepository demandeMaterielRepository;
    private final EvenementScientifiqueRepository evenementRepository;
    private final RapportActiviteRepository rapportRepository;
    private final PublicationRepository publicationRepository;
    private final ReunionRepository reunionRepository;
    private final SecurityService securityService;

    @Transactional(readOnly = true)
    public IndicateursDirectionDTO getIndicateursDirection() {
        long adhesions = demandeAdhesionRepository.countByStatut(StatutDemande.EN_ATTENTE);
        long materiel = demandeMaterielRepository.countByStatut(StatutDemandeMateriel.EN_ATTENTE);
        long evenements = evenementRepository.findByStatutValidation(StatutValidationEvenement.EN_ATTENTE_VALIDATION).size();

        int anneeEnCours = LocalDate.now().getYear();
        String etatRapport = rapportRepository.findByAnnee(anneeEnCours)
                .map(r -> r.getStatut().name())
                .orElse("ABSENT");

        return IndicateursDirectionDTO.builder()
                .adhesionsEnAttente(adhesions)
                .demandesMaterielEnAttente(materiel)
                .evenementsEnAttente(evenements)
                .etatRapportAnnuel(etatRapport)
                .build();
    }

    @Transactional(readOnly = true)
    public TableauBordMembreDTO getIndicateursMembre() {
        Long currentId = securityService.getIdUtilisateurConnecte();
        if (currentId == null) {
            return TableauBordMembreDTO.builder()
                    .publications(0L)
                    .reunions(0L)
                    .demandesMateriel(0L)
                    .evenements(0L)
                    .build();
        }

        long pubs = publicationRepository.findByAuteurId(currentId).size();
        long reunions = reunionRepository.findReunionsPourMembre(currentId).size();
        long demandes = demandeMaterielRepository.findByDemandeurId(currentId).size();
        long evenements = evenementRepository.findAll().stream()
                .filter(e -> e.getOrganisateurs().stream().anyMatch(m -> m.getId().equals(currentId)) ||
                             e.getParticipations().stream().anyMatch(p -> p.getMembre().getId().equals(currentId)))
                .count();

        return TableauBordMembreDTO.builder()
                .publications(pubs)
                .reunions(reunions)
                .demandesMateriel(demandes)
                .evenements(evenements)
                .build();
    }
}

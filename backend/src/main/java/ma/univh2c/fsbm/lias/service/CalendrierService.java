package ma.univh2c.fsbm.lias.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.univh2c.fsbm.lias.dto.EvenementCalendrierDTO;
import ma.univh2c.fsbm.lias.entity.EvenementScientifique;
import ma.univh2c.fsbm.lias.entity.Reunion;
import ma.univh2c.fsbm.lias.enums.TypeCalendrier;
import ma.univh2c.fsbm.lias.repository.EvenementScientifiqueRepository;
import ma.univh2c.fsbm.lias.repository.ReunionRepository;
import ma.univh2c.fsbm.lias.security.SecurityService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CalendrierService {

    private final EvenementScientifiqueRepository evenementRepository;
    private final ReunionRepository reunionRepository;
    private final SecurityService securityService;

    @Transactional(readOnly = true)
    public List<EvenementCalendrierDTO> getEvenementsPourCalendrier(LocalDateTime start, LocalDateTime end, boolean inclureReunions) {
        List<EvenementCalendrierDTO> result = new ArrayList<>();

        LocalDateTime s = start != null ? start : LocalDateTime.now().minusMonths(1);
        LocalDateTime e = end != null ? end : LocalDateTime.now().plusMonths(6);

        // Événements scientifiques validés
        List<EvenementScientifique> evenements = evenementRepository.findEvenementsPourCalendrier(s, e);
        for (EvenementScientifique evt : evenements) {
            TypeCalendrier tc;
            try {
                tc = TypeCalendrier.valueOf(evt.getType().name());
            } catch (Exception ex) {
                tc = TypeCalendrier.CONFERENCE;
            }

            result.add(EvenementCalendrierDTO.builder()
                    .id(evt.getId())
                    .title(evt.getTitre())
                    .start(evt.getDateDebut())
                    .end(evt.getDateFin())
                    .type(tc)
                    .build());
        }

        // Réunions pour les membres connectés
        if (inclureReunions) {
            Long currentId = securityService.getIdUtilisateurConnecte();
            if (currentId != null) {
                List<Reunion> reunions = reunionRepository.findReunionsPourCalendrier(currentId, s, e);
                for (Reunion r : reunions) {
                    result.add(EvenementCalendrierDTO.builder()
                            .id(r.getId())
                            .title("Réunion : " + r.getTitre())
                            .start(r.getDateReunion())
                            .end(r.getDateReunion().plusHours(2)) // fin par défaut
                            .type(TypeCalendrier.REUNION)
                            .build());
                }
            }
        }

        return result;
    }
}

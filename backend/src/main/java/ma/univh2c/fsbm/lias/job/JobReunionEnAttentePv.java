package ma.univh2c.fsbm.lias.job;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.univh2c.fsbm.lias.entity.Reunion;
import ma.univh2c.fsbm.lias.enums.StatutReunion;
import ma.univh2c.fsbm.lias.repository.ReunionRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class JobReunionEnAttentePv {

    private final ReunionRepository reunionRepository;

    @Scheduled(cron = "0 0 * * * *", zone = "Africa/Casablanca")
    @Transactional
    public void executer() {
        log.info("Démarrage du job de vérification des réunions passées sans PV...");
        List<Reunion> reunions = reunionRepository.findAll();
        LocalDateTime now = LocalDateTime.now();
        for (Reunion r : reunions) {
            if (r.getStatut() == StatutReunion.PLANIFIEE && r.getDateReunion().isBefore(now)) {
                r.setStatut(StatutReunion.EN_ATTENTE_PV);
                reunionRepository.save(r);
                log.info("Réunion id={} passée en EN_ATTENTE_PV", r.getId());
            }
        }
    }
}

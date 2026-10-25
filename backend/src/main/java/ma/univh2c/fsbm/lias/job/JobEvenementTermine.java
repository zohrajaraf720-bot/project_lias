package ma.univh2c.fsbm.lias.job;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.univh2c.fsbm.lias.entity.EvenementScientifique;
import ma.univh2c.fsbm.lias.enums.StatutEvenement;
import ma.univh2c.fsbm.lias.enums.StatutValidationEvenement;
import ma.univh2c.fsbm.lias.repository.EvenementScientifiqueRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class JobEvenementTermine {

    private final EvenementScientifiqueRepository evenementRepository;

    @Scheduled(cron = "0 0 1 * * *", zone = "Africa/Casablanca")
    @Transactional
    public void executer() {
        log.info("Démarrage du job de clôture des événements terminés...");
        List<EvenementScientifique> evenements = evenementRepository.findAll();
        LocalDateTime now = LocalDateTime.now();
        for (EvenementScientifique e : evenements) {
            if (e.getStatut() == StatutEvenement.EN_PREPARATION
                    && e.getStatutValidation() == StatutValidationEvenement.VALIDE
                    && e.getDateFin().isBefore(now)) {
                e.setStatut(StatutEvenement.TERMINE);
                evenementRepository.save(e);
                log.info("Événement id={} passé à TERMINE", e.getId());
            }
        }
    }
}

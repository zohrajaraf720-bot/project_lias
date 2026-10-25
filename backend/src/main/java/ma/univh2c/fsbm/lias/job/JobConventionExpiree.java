package ma.univh2c.fsbm.lias.job;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.univh2c.fsbm.lias.entity.Convention;
import ma.univh2c.fsbm.lias.enums.StatutConvention;
import ma.univh2c.fsbm.lias.repository.ConventionRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class JobConventionExpiree {

    private final ConventionRepository conventionRepository;

    @Scheduled(cron = "0 5 0 * * *", zone = "Africa/Casablanca")
    @Transactional
    public void executer() {
        log.info("Démarrage du job d'expiration des conventions...");
        List<Convention> conventions = conventionRepository.findConventionsExpirees();
        for (Convention c : conventions) {
            c.setStatut(StatutConvention.TERMINEE);
            conventionRepository.save(c);
            log.info("Convention id={} passée à TERMINEE", c.getId());
        }
    }
}

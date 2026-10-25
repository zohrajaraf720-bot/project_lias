package ma.univh2c.fsbm.lias.job;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.univh2c.fsbm.lias.repository.JetonSecuriteRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class JobPurgeJetons {

    private final JetonSecuriteRepository jetonRepository;

    @Scheduled(cron = "0 0 2 * * *", zone = "Africa/Casablanca")
    public void executer() {
        log.info("Purge des jetons de sécurité expirés ou révoqués...");
        jetonRepository.purgerJetonsExpires();
    }
}

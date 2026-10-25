package ma.univh2c.fsbm.lias.aspect;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.univh2c.fsbm.lias.security.SecurityService;
import ma.univh2c.fsbm.lias.service.AuditService;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class TraceAuditAspect {

    private final AuditService auditService;
    private final SecurityService securityService;

    @AfterReturning(pointcut = "@annotation(audite)", returning = "result")
    public void tracerAction(JoinPoint joinPoint, Audite audite, Object result) {
        try {
            Long auteurId = securityService.getIdUtilisateurConnecte();
            String description = "Action " + audite.action() + " sur " + audite.entite();

            Long entiteId = null;
            Object[] args = joinPoint.getArgs();
            if (args != null && args.length > 0 && args[0] instanceof Long id) {
                entiteId = id;
            }

            auditService.enregistrerAudit(audite.action(), audite.entite(), entiteId, description, auteurId);
        } catch (Exception e) {
            log.error("Échec de l'enregistrement de l'audit: {}", e.getMessage());
        }
    }
}

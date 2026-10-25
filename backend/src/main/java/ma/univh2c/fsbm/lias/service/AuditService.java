package ma.univh2c.fsbm.lias.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.univh2c.fsbm.lias.dto.TraceAuditDTO;
import ma.univh2c.fsbm.lias.entity.Membre;
import ma.univh2c.fsbm.lias.entity.TraceAudit;
import ma.univh2c.fsbm.lias.enums.TypeAction;
import ma.univh2c.fsbm.lias.repository.MembreRepository;
import ma.univh2c.fsbm.lias.repository.TraceAuditRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final TraceAuditRepository auditRepository;
    private final MembreRepository membreRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void enregistrerAudit(TypeAction action, String nomEntite, Long idEntite, String description, Long auteurId) {
        try {
            Membre auteur = null;
            if (auteurId != null) {
                auteur = membreRepository.findById(auteurId).orElse(null);
            }

            TraceAudit trace = TraceAudit.builder()
                    .dateAction(LocalDateTime.now())
                    .typeAction(action)
                    .nomEntite(nomEntite)
                    .idEntite(idEntite)
                    .descriptionDetails(description)
                    .auteur(auteur)
                    .build();

            auditRepository.save(trace);
        } catch (Exception e) {
            log.error("Erreur lors de la persistance de l'audit: {}", e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public Page<TraceAuditDTO> lister(Pageable pageable) {
        return auditRepository.findAllByOrderByDateActionDesc(pageable)
                .map(this::convertirEnDTO);
    }

    private TraceAuditDTO convertirEnDTO(TraceAudit t) {
        return TraceAuditDTO.builder()
                .id(t.getId())
                .dateAction(t.getDateAction())
                .typeAction(t.getTypeAction())
                .nomEntite(t.getNomEntite())
                .idEntite(t.getIdEntite())
                .descriptionDetails(t.getDescriptionDetails())
                .auteurNom(t.getAuteur() != null ? t.getAuteur().getPrenom() + " " + t.getAuteur().getNom() : "Système")
                .auteurEmail(t.getAuteur() != null ? t.getAuteur().getEmail() : "systeme@lias.fsbm.ma")
                .build();
    }
}

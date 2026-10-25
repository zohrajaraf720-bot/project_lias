package ma.univh2c.fsbm.lias.controller;

import lombok.RequiredArgsConstructor;
import ma.univh2c.fsbm.lias.dto.IndicateursDirectionDTO;
import ma.univh2c.fsbm.lias.dto.TableauBordMembreDTO;
import ma.univh2c.fsbm.lias.service.TableauBordService;
import ma.univh2c.fsbm.lias.service.PublicationService;
import ma.univh2c.fsbm.lias.service.ReunionService;
import ma.univh2c.fsbm.lias.service.MaterielService;
import ma.univh2c.fsbm.lias.security.MembreDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class TableauBordController {

    private final TableauBordService tableauBordService;
    private final PublicationService publicationService;
    private final ReunionService reunionService;
    private final MaterielService materielService;

    @GetMapping("/direction")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<IndicateursDirectionDTO> getIndicateursDirection() {
        return ResponseEntity.ok(tableauBordService.getIndicateursDirection());
    }

    @GetMapping("/membre")
    public ResponseEntity<TableauBordMembreDTO> getIndicateursMembre() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Long membreId = null;
        if (auth != null && auth.getPrincipal() instanceof MembreDetails md) {
            membreId = md.getId();
        }
        
        long countPubs = (membreId != null) ? publicationService.listerPublicationsParMembre(membreId).size() : 0;
        long countReunions = reunionService.listerReunionsDuMembre().size();
        final Long currentId = membreId;
        long countDemandes = (currentId != null)
                ? materielService.listerDemandes().stream()
                        .filter(d -> d.getDemandeur() != null && d.getDemandeur().getId().equals(currentId)).count()
                : 0;

        TableauBordMembreDTO stats = TableauBordMembreDTO.builder()
                .publications(countPubs)
                .reunions(countReunions)
                .demandesMateriel(countDemandes)
                .build();

        return ResponseEntity.ok(stats);
    }
}

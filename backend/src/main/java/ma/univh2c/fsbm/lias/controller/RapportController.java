package ma.univh2c.fsbm.lias.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.univh2c.fsbm.lias.dto.RapportActiviteDTO;
import ma.univh2c.fsbm.lias.dto.RapportGenererRequest;
import ma.univh2c.fsbm.lias.service.RapportService;
import ma.univh2c.fsbm.lias.repository.RapportActiviteRepository;
import ma.univh2c.fsbm.lias.service.FileStorageService;
import ma.univh2c.fsbm.lias.entity.RapportActivite;
import ma.univh2c.fsbm.lias.exception.RessourceIntrouvableException;
import ma.univh2c.fsbm.lias.exception.ConflitEtatException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.HttpHeaders;

import java.util.List;

@RestController
@RequestMapping("/api/rapports")
@RequiredArgsConstructor
public class RapportController {

    private final RapportService rapportService;
    private final RapportActiviteRepository rapportRepository;
    private final FileStorageService fileStorageService;

    @GetMapping
    public ResponseEntity<List<RapportActiviteDTO>> getRapports() {
        return ResponseEntity.ok(rapportService.listerRapports());
    }

    @GetMapping("/{annee}")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<RapportActiviteDTO> getRapportParAnnee(@PathVariable int annee) {
        return ResponseEntity.ok(rapportService.getRapportDTOParAnnee(annee));
    }

    @PostMapping({"/generer", "/generer/{annee}"})
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<RapportActiviteDTO> genererRapport(
            @PathVariable(required = false) Integer annee,
            @RequestBody(required = false) RapportGenererRequest request) {
        int anneeCible = (annee != null) ? annee : (request != null ? request.getAnnee() : java.time.LocalDate.now().getYear());
        return ResponseEntity.status(HttpStatus.CREATED).body(rapportService.genererBrouillon(new RapportGenererRequest(anneeCible)));
    }

    @PostMapping("/{id}/regenerer")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<RapportActiviteDTO> regenererRapportParId(@PathVariable Long id) {
        RapportActivite rapport = rapportRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Rapport introuvable"));
        return ResponseEntity.ok(rapportService.genererBrouillon(new RapportGenererRequest(rapport.getAnnee())));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<RapportActiviteDTO> sauvegarderRapport(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> payload) {
        String markdown = payload != null ? payload.getOrDefault("contenuMarkdown", "") : "";
        return ResponseEntity.ok(rapportService.sauvegarderMarkdown(id, markdown));
    }

    @PostMapping("/{id}/finaliser")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<RapportActiviteDTO> finaliserRapport(@PathVariable Long id) {
        return ResponseEntity.ok(rapportService.finaliserEtRegenererPdf(id));
    }

    @PutMapping("/{id}/valider")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<Void> validerRapport(@PathVariable Long id) {
        rapportService.validerEtFermerRapport(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/pdf")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<Resource> telechargerPdfRapport(@PathVariable Long id) {
        RapportActivite rapport = rapportRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Rapport introuvable"));
                
        if (rapport.getCheminFichierPdf() == null) {
            throw new ConflitEtatException("Le PDF du rapport n'est pas encore disponible");
        }
        
        Resource resource = fileStorageService.chargerFichier(rapport.getCheminFichierPdf());
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"Rapport_LIAS_" + rapport.getAnnee() + ".pdf\"")
                .body(resource);
    }
}

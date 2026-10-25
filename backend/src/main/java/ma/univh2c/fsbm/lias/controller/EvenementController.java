package ma.univh2c.fsbm.lias.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.univh2c.fsbm.lias.dto.DecisionEvenementRequest;
import ma.univh2c.fsbm.lias.dto.EvenementDTO;
import ma.univh2c.fsbm.lias.dto.EvenementRequest;
import ma.univh2c.fsbm.lias.service.EvenementService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/evenements")
@RequiredArgsConstructor
public class EvenementController {

    private final EvenementService evenementService;

    @GetMapping
    public ResponseEntity<ma.univh2c.fsbm.lias.dto.PageDTO<EvenementDTO>> getEvenements(
            @RequestParam(required = false) ma.univh2c.fsbm.lias.enums.TypeEvenement type,
            @RequestParam(required = false) ma.univh2c.fsbm.lias.enums.StatutEvenement statut,
            @RequestParam(required = false) ma.univh2c.fsbm.lias.enums.StatutValidationEvenement statutValidation,
            @RequestParam(required = false) String edition,
            org.springframework.data.domain.Pageable pageable) {
        
        return ResponseEntity.ok(evenementService.rechercherEvenements(type, statut, statutValidation, edition, pageable));
    }

    @GetMapping("/a-valider")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('CHEF_EQUIPE') or hasRole('ADMIN')")
    public ResponseEntity<List<EvenementDTO>> getEvenementsAValider() {
        return ResponseEntity.ok(evenementService.listerEvenementsAValider());
    }

    @GetMapping("/gouvernance")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('CHEF_EQUIPE') or hasRole('ADMIN')")
    public ResponseEntity<List<EvenementDTO>> getEvenementsGouvernance() {
        return ResponseEntity.ok(evenementService.listerEvenementsGouvernance());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EvenementDTO> getEvenement(@PathVariable Long id) {
        return ResponseEntity.ok(evenementService.getEvenement(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('PERMANENT') or hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<EvenementDTO> creerEvenement(@Valid @RequestBody EvenementRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(evenementService.creerEvenement(request));
    }

    @PutMapping("/{id}/valider")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<Void> validerEvenement(@PathVariable Long id,
            @RequestBody(required = false) DecisionEvenementRequest request) {
        evenementService.validerEvenement(id, request != null ? request : new DecisionEvenementRequest());
        return ResponseEntity.ok().build();
    }

    @PutMapping({ "/{id}/refuser", "/{id}/rejeter" })
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<Void> refuserEvenement(@PathVariable Long id,
            @Valid @RequestBody DecisionEvenementRequest request) {
        evenementService.refuserEvenement(id, request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/archives")
    public ResponseEntity<List<EvenementDTO>> getArchives() {
        return ResponseEntity.ok(evenementService.listerArchives());
    }

    @PutMapping("/{id}/archiver")
    @PreAuthorize("@securite.estOrganisateurEvenement(#id) or hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<Void> archiverEvenement(@PathVariable Long id) {
        evenementService.archiverEdition(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/participations")
    public ResponseEntity<List<ma.univh2c.fsbm.lias.dto.MembreResumeDTO>> getParticipants(@PathVariable Long id) {
        return ResponseEntity.ok(evenementService.listerParticipants(id));
    }
    
    @PostMapping({"/{id}/participations", "/{id}/inscrire"})
    public ResponseEntity<Void> participer(@PathVariable Long id) {
        evenementService.participer(id);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @RequestMapping(value = {"/{id}/participations/moi/annuler", "/{id}/desinscrire"}, method = {RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.POST})
    public ResponseEntity<Void> annulerParticipation(@PathVariable Long id) {
        evenementService.annulerParticipation(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("@securite.estOrganisateurEvenement(#id) or hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<EvenementDTO> modifierEvenement(@PathVariable Long id,
            @Valid @RequestBody EvenementRequest request) {
        return ResponseEntity.ok(evenementService.modifierEvenement(id, request));
    }
}

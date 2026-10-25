package ma.univh2c.fsbm.lias.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.univh2c.fsbm.lias.dto.*;
import ma.univh2c.fsbm.lias.enums.StatutDemande;
import ma.univh2c.fsbm.lias.service.EquipeService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/equipes")
@RequiredArgsConstructor
public class EquipeController {

    private final EquipeService equipeService;

    @GetMapping
    public ResponseEntity<List<EquipeDTO>> getEquipes() {
        return ResponseEntity.ok(equipeService.listerEquipes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EquipePublicDTO> getEquipeById(@PathVariable Long id) {
        return ResponseEntity.ok(equipeService.getEquipePublique(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<EquipeDTO> creerEquipe(@Valid @RequestBody EquipeRequest request) {
        EquipeDTO response = equipeService.creerEquipe(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN') or @securite.estChefDeLEquipe(#id)")
    public ResponseEntity<EquipeDTO> modifierEquipe(@PathVariable Long id, @Valid @RequestBody EquipeRequest request) {
        return ResponseEntity.ok(equipeService.modifierEquipe(id, request));
    }

    /**
     * Changer le chef d'une équipe par la Direction ou l'Admin (le nouveau chef doit être un membre de l'équipe).
     */
    @PutMapping("/{id}/chef")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<EquipeDTO> changerChefEquipe(
            @PathVariable Long id,
            @Valid @RequestBody ChangementChefEquipeRequest request) {
        return ResponseEntity.ok(equipeService.changerChefEquipe(id, request));
    }

    // =========================================================================
    // DEMANDES DE MODIFICATION D'ÉQUIPE (Nom, Description, Thématiques)
    // =========================================================================

    @PostMapping("/{id}/demandes-modification")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN') or @securite.estChefDeLEquipe(#id)")
    public ResponseEntity<DemandeModificationEquipeDTO> demanderModification(
            @PathVariable Long id,
            @Valid @RequestBody DemandeModificationEquipeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(equipeService.demanderModificationParChef(id, request));
    }

    @GetMapping("/{id}/demandes-modification")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN') or @securite.estChefDeLEquipe(#id)")
    public ResponseEntity<List<DemandeModificationEquipeDTO>> getDemandesModificationEquipe(@PathVariable Long id) {
        return ResponseEntity.ok(equipeService.listerDemandesModificationEquipe(id));
    }

    @GetMapping("/demandes-modification")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<List<DemandeModificationEquipeDTO>> getToutesDemandesModification(
            @RequestParam(required = false) StatutDemande statut) {
        return ResponseEntity.ok(equipeService.listerToutesDemandesModification(statut));
    }

    @PutMapping("/demandes-modification/{demandeId}/accepter")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<DemandeModificationEquipeDTO> accepterDemandeModification(@PathVariable Long demandeId) {
        return ResponseEntity.ok(equipeService.accepterDemandeModification(demandeId));
    }

    @PutMapping("/demandes-modification/{demandeId}/refuser")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<DemandeModificationEquipeDTO> refuserDemandeModification(
            @PathVariable Long demandeId,
            @RequestBody(required = false) DecisionModificationEquipeRequest request) {
        String motif = request != null ? request.getMotif() : null;
        return ResponseEntity.ok(equipeService.refuserDemandeModification(demandeId, motif));
    }

    // =========================================================================
    // DEMANDES DE MOBILITÉ / CHANGEMENT D'ÉQUIPE (Rattachement, Transfert, Détachement)
    // =========================================================================

    @PostMapping("/demandes-changement")
    @PreAuthorize("!hasRole('ADMIN') and isAuthenticated()")
    public ResponseEntity<DemandeChangementEquipeDTO> demanderChangementEquipe(
            @Valid @RequestBody DemandeChangementEquipeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(equipeService.demanderChangementEquipe(request));
    }

    @GetMapping("/mes-demandes-changement")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<DemandeChangementEquipeDTO>> getMesDemandesChangement() {
        return ResponseEntity.ok(equipeService.listerMesDemandesChangement());
    }

    @GetMapping("/demandes-changement")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<List<DemandeChangementEquipeDTO>> getToutesDemandesChangement(
            @RequestParam(required = false) StatutDemande statut) {
        return ResponseEntity.ok(equipeService.listerToutesDemandesChangement(statut));
    }

    @PutMapping("/demandes-changement/{demandeId}/accepter")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<DemandeChangementEquipeDTO> accepterDemandeChangement(@PathVariable Long demandeId) {
        return ResponseEntity.ok(equipeService.accepterDemandeChangement(demandeId));
    }

    @PutMapping("/demandes-changement/{demandeId}/refuser")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<DemandeChangementEquipeDTO> refuserDemandeChangement(
            @PathVariable Long demandeId,
            @RequestBody(required = false) DecisionChangementEquipeRequest request) {
        return ResponseEntity.ok(equipeService.refuserDemandeChangement(demandeId, request));
    }

    @PutMapping("/affectation-directe")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<DemandeChangementEquipeDTO> affecterMembreDirectement(
            @Valid @RequestBody AffectationDirecteEquipeRequest request) {
        return ResponseEntity.ok(equipeService.affecterMembreDirectement(request));
    }

    @PutMapping("/membres/{membreId}/equipe")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<DemandeChangementEquipeDTO> changerEquipeMembre(
            @PathVariable Long membreId,
            @RequestBody AffectationDirecteEquipeRequest request) {
        request.setMembreId(membreId);
        return ResponseEntity.ok(equipeService.affecterMembreDirectement(request));
    }

    @PutMapping("/{id}/archiver")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<Void> archiverEquipe(@PathVariable Long id) {
        equipeService.archiverEquipe(id);
        return ResponseEntity.ok().build();
    }
}

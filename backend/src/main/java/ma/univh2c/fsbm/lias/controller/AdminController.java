package ma.univh2c.fsbm.lias.controller;

import lombok.RequiredArgsConstructor;
import ma.univh2c.fsbm.lias.entity.Laboratoire;
import ma.univh2c.fsbm.lias.dto.PageDTO;
import ma.univh2c.fsbm.lias.dto.CompteAdminDTO;
import ma.univh2c.fsbm.lias.dto.AdminCreationCompteRequest;
import ma.univh2c.fsbm.lias.dto.TraceAuditDTO;
import ma.univh2c.fsbm.lias.service.AuditService;
import ma.univh2c.fsbm.lias.service.MembreService;
import ma.univh2c.fsbm.lias.repository.LaboratoireRepository;
import ma.univh2c.fsbm.lias.repository.JetonSecuriteRepository;
import ma.univh2c.fsbm.lias.enums.EtatCompte;
import ma.univh2c.fsbm.lias.enums.StatutMembre;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AuditService auditService;
    private final LaboratoireRepository laboratoireRepository;
    private final MembreService membreService;
    private final JetonSecuriteRepository jetonSecuriteRepository;

    @GetMapping("/audit")
    public ResponseEntity<PageDTO<TraceAuditDTO>> getJournalAudit(
            @PageableDefault(size = 50, sort = "dateAction", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<TraceAuditDTO> p = auditService.lister(pageable);
        return ResponseEntity.ok(PageDTO.from(p, p.getContent()));
    }

    @GetMapping({"/parametrage", "/laboratoire"})
    public ResponseEntity<Laboratoire> getParametrage() {
        return ResponseEntity.ok(laboratoireRepository.findAll().stream().findFirst().orElse(new Laboratoire()));
    }

    @PutMapping({"/parametrage", "/laboratoire"})
    public ResponseEntity<Laboratoire> updateParametrage(
            @Valid @RequestBody ma.univh2c.fsbm.lias.dto.ParametrageDTO request) {
        Laboratoire existant = laboratoireRepository.findAll().stream().findFirst().orElse(new Laboratoire());
        existant.setNom(request.getNom());
        if (request.getAcronyme() != null) existant.setAcronyme(request.getAcronyme());
        if (request.getEtablissement() != null) existant.setEtablissement(request.getEtablissement());
        if (request.getUniversite() != null) existant.setUniversite(request.getUniversite());
        if (request.getDateCreation() != null) existant.setDateCreation(request.getDateCreation());
        existant.setDescription(request.getDescription());
        existant.setAdresse(request.getAdresse());
        existant.setEmailContact(request.getEmailContact());
        existant.setTelephone(request.getTelephone());
        existant.setSiteWeb(request.getSiteWeb());
        if (request.getLogo() != null) existant.setLogo(request.getLogo());
        return ResponseEntity.ok(laboratoireRepository.save(existant));
    }

    @PostMapping("/maintenance")
    public ResponseEntity<Map<String, String>> executerMaintenance(@RequestBody Map<String, String> payload) {
        String action = payload.get("action");
        if ("PURGE_JETONS".equalsIgnoreCase(action)) {
            jetonSecuriteRepository.purgerJetonsExpires();
            return ResponseEntity.ok(Map.of("status", "success", "message", "Jetons expirés purgés avec succès."));
        }
        throw new IllegalArgumentException("Action de maintenance inconnue : " + action);
    }

    @PostMapping("/comptes")
    public ResponseEntity<CompteAdminDTO> creerCompte(@Valid @RequestBody AdminCreationCompteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(membreService.creerMembreParAdmin(request));
    }

    @PostMapping("/comptes/{id}/reinitialiser-mdp")
    public ResponseEntity<Map<String, String>> reinitialiserMotDePasse(@PathVariable Long id) {
        String mdp = membreService.reinitialiserMotDePasseParAdmin(id);
        return ResponseEntity.ok(Map.of("status", "success", "nouveauMotDePasse", mdp));
    }

    @PutMapping("/comptes/{id}/etat")
    public ResponseEntity<Void> changerEtatCompte(@PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        String action = body != null ? (String) body.get("action") : null;
        String etat = body != null ? (String) body.get("etat") : null;
        String effectiveAction = action != null ? action : etat;
        LocalDate date = (body != null && body.get("date") != null)
                ? LocalDate.parse(body.get("date").toString())
                : LocalDate.now();

        if ("GELER".equalsIgnoreCase(effectiveAction) || "GELE".equalsIgnoreCase(effectiveAction) || "RETRAITE".equalsIgnoreCase(effectiveAction)) {
            membreService.mettreALaRetraite(id, date);
        } else if ("DESACTIVER".equalsIgnoreCase(effectiveAction) || "DESACTIVE".equalsIgnoreCase(effectiveAction) || "DEPART".equalsIgnoreCase(effectiveAction)) {
            membreService.declarerDepart(id, date);
        } else if ("REACTIVER".equalsIgnoreCase(effectiveAction) || "ACTIF".equalsIgnoreCase(effectiveAction)) {
            membreService.reactiverCompte(id, date);
        } else {
            throw new IllegalArgumentException("Action invalide : " + effectiveAction);
        }
        return ResponseEntity.ok().build();
    }

    @GetMapping("/comptes")
    public ResponseEntity<PageDTO<CompteAdminDTO>> getComptes(
            @RequestParam(required = false) StatutMembre statut,
            @RequestParam(required = false) EtatCompte etatCompte,
            @PageableDefault(size = 20, sort = "nom") Pageable pageable) {

        return ResponseEntity.ok(membreService.listerComptesPourAdmin(statut, etatCompte, pageable));
    }
}

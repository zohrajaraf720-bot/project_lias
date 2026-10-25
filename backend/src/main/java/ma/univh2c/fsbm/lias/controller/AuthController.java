package ma.univh2c.fsbm.lias.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.univh2c.fsbm.lias.dto.AuthResponseDTO;
import ma.univh2c.fsbm.lias.dto.LoginRequest;
import ma.univh2c.fsbm.lias.dto.MeDTO;
import ma.univh2c.fsbm.lias.dto.MotDePasseOublieRequest;
import ma.univh2c.fsbm.lias.dto.RefreshRequest;
import ma.univh2c.fsbm.lias.dto.ReinitialisationRequest;
import ma.univh2c.fsbm.lias.dto.ChangementMotDePasseRequest;
import ma.univh2c.fsbm.lias.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping({"/login", "/connexion"})
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping({"/refresh", "/rafraichir"})
    public ResponseEntity<AuthResponseDTO> refresh(@Valid @RequestBody RefreshRequest request) {
        return ResponseEntity.ok(authService.refresh(request));
    }

    // NOUVEAU : profil + statut + autorités à jour de l'utilisateur connecté (authentifié, non public)
    @GetMapping({"/me", "/moi"})
    public ResponseEntity<MeDTO> me() {
        return ResponseEntity.ok(authService.me());
    }

    @PostMapping({"/logout", "/deconnexion"})
    public ResponseEntity<Void> logout(@RequestBody(required = false) Map<String, String> payload) {
        String token = payload != null ? payload.get("refreshToken") : null;
        authService.logout(token);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/mot-de-passe")
    public ResponseEntity<Void> changerMotDePasse(@Valid @RequestBody ChangementMotDePasseRequest request) {
        authService.changerMotDePasse(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/mot-de-passe-oublie")
    public ResponseEntity<Void> demanderReinitialisation(@Valid @RequestBody MotDePasseOublieRequest request) {
        authService.demanderReinitialisation(request);
        return ResponseEntity.ok().build(); // Toujours 200 pour ne pas révéler l'existence du compte
    }

    @PostMapping({"/reinitialiser", "/reinitialiser-mot-de-passe"})
    public ResponseEntity<Void> reinitialiserMotDePasse(@Valid @RequestBody ReinitialisationRequest request) {
        authService.reinitialiserMotDePasse(request);
        return ResponseEntity.ok().build();
    }
}

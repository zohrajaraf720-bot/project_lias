package ma.univh2c.fsbm.lias.controller;

import lombok.RequiredArgsConstructor;
import ma.univh2c.fsbm.lias.dto.EvenementCalendrierDTO;
import ma.univh2c.fsbm.lias.service.CalendrierService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/calendrier")
@RequiredArgsConstructor
public class CalendrierController {

    private final CalendrierService calendrierService;

    @GetMapping("/evenements")
    public ResponseEntity<List<EvenementCalendrierDTO>> getCalendrier(
            @RequestParam("start") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam("end") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {

        // Vérifie si l'utilisateur est authentifié pour décider s'il a le droit de voir les réunions
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean inclureReunions = auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser");

        return ResponseEntity.ok(calendrierService.getEvenementsPourCalendrier(start, end, inclureReunions));
    }
}
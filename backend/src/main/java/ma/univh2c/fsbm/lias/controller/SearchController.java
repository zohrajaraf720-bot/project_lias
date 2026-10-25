package ma.univh2c.fsbm.lias.controller;

import lombok.RequiredArgsConstructor;
import ma.univh2c.fsbm.lias.dto.SearchResultDTO;
import ma.univh2c.fsbm.lias.service.RechercheGlobaleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/search", "/api/recherche"})
@RequiredArgsConstructor
public class SearchController {

    private final RechercheGlobaleService rechercheGlobaleService;

    @GetMapping
    public ResponseEntity<SearchResultDTO> search(@RequestParam("q") String query) {
        return ResponseEntity.ok(rechercheGlobaleService.rechercher(query));
    }
}
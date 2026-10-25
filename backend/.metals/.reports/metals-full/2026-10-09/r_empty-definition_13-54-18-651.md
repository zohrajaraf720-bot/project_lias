error id: file:///C:/Users/moham/Documents/JEE/lias/backend/src/main/java/ma/univh2c/fsbm/lias/service/RapportService.java:ma/univh2c/fsbm/lias/repository/EvenementRepository#
file:///C:/Users/moham/Documents/JEE/lias/backend/src/main/java/ma/univh2c/fsbm/lias/service/RapportService.java
empty definition using pc, found symbol in pc: ma/univh2c/fsbm/lias/repository/EvenementRepository#
empty definition using semanticdb
empty definition using fallback
non-local guesses:

offset: 711
uri: file:///C:/Users/moham/Documents/JEE/lias/backend/src/main/java/ma/univh2c/fsbm/lias/service/RapportService.java
text:
```scala
package ma.univh2c.fsbm.lias.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import ma.univh2c.fsbm.lias.dto.RapportActiviteDTO;
import ma.univh2c.fsbm.lias.dto.RapportGenererRequest;
import ma.univh2c.fsbm.lias.entity.RapportActivite;
import ma.univh2c.fsbm.lias.enums.StatutRapport;
import ma.univh2c.fsbm.lias.exception.ConflitEtatException;
import ma.univh2c.fsbm.lias.exception.RessourceIntrouvableException;
import ma.univh2c.fsbm.lias.mapper.RapportMapper;
import ma.univh2c.fsbm.lias.repository.PublicationRepository;
import ma.univh2c.fsbm.lias.repository.RapportActiviteRepository;
import ma.univh2c.fsbm.lias.repository.EvenementRepos@@itory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
@RequiredArgsConstructor
public class RapportService {

    private final RapportActiviteRepository rapportRepository;
    private final PublicationRepository publicationRepository;
    private final RapportMapper rapportMapper;
    private final ObjectMapper objectMapper;

    public List<RapportActiviteDTO> listerRapports() {
        return rapportMapper.toDtoList(rapportRepository.findAll());
    }

    @Transactional
    public RapportActiviteDTO genererBrouillon(RapportGenererRequest request) {
        if (rapportRepository.existsByAnnee(request.getAnnee())) {
            throw new ConflitEtatException("RAPPORT_EXISTANT", "Un rapport existe déjà pour cette année");
        }

        Map<String, Object> bilanAnnuel = new HashMap<>();
        bilanAnnuel.put("annee", request.getAnnee());
        
        long totalPubs = publicationRepository.findByAnnee(request.getAnnee()).size();
        long totalEvts = evenementRepository.findAll().stream()
                .filter(e -> e.getDateDebut().getYear() == request.getAnnee()).count();
        // En supposant que vous injectez activiteRepository dans RapportService
        long totalActs = activiteRepository.findAll().stream()
                .filter(a -> a.getDateDebut().getYear() == request.getAnnee()).count();

        bilanAnnuel.put("total_publications", totalPubs);
        bilanAnnuel.put("total_evenements", totalEvts);
        bilanAnnuel.put("total_activites", totalActs);
        
        String donneesJson;
        try {
            donneesJson = objectMapper.writeValueAsString(bilanAnnuel);
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la sérialisation du bilan annuel", e);
        }

        // 2. Création du brouillon
        RapportActivite rapport = new RapportActivite();
        rapport.setAnnee(request.getAnnee());
        rapport.setDateGeneration(LocalDateTime.now());
        rapport.setStatut(StatutRapport.BROUILLON);
        rapport.setDonneesBrutes(donneesJson);

        return rapportMapper.toDto(rapportRepository.save(rapport));
    }

    @Transactional
    public void validerEtFermerRapport(Long id) {
        RapportActivite rapport = rapportRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Rapport introuvable"));

        if (rapport.getStatut() == StatutRapport.FINALISE) {
            throw new ConflitEtatException("RAPPORT_DEJA_FINALISE", "Ce rapport est déjà validé.");
        }

        rapport.setStatut(StatutRapport.FINALISE);
        
        try {
            // Création du répertoire si inexistant
            Path uploadPath = Paths.get("uploads/rapports");
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            
            String fileName = "uploads/rapports/rapport_" + rapport.getAnnee() + "_" + System.currentTimeMillis() + ".pdf";
            
            // Génération PDF basique avec iText
            PdfWriter writer = new PdfWriter(fileName);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);
            
            document.add(new Paragraph("Rapport Annuel du Laboratoire LIAS"));
            document.add(new Paragraph("Année : " + rapport.getAnnee()));
            document.add(new Paragraph("Données agrégées : " + rapport.getDonneesBrutes()));
            document.close();

            rapport.setCheminFichierPdf(fileName);
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la génération physique du fichier PDF", e);
        }
        
        rapportRepository.save(rapport);
    }
}
```


#### Short summary: 

empty definition using pc, found symbol in pc: ma/univh2c/fsbm/lias/repository/EvenementRepository#
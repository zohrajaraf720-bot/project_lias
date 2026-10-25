package ma.univh2c.fsbm.lias.dto;

import lombok.*;
import ma.univh2c.fsbm.lias.enums.StatutRapport;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RapportActiviteDTO {
    private Long id;
    private Integer annee;
    private LocalDateTime dateGeneration;
    private StatutRapport statut;
    private String cheminFichierPdf;
    private String donneesBrutes;
    private String contenuMarkdown;
}

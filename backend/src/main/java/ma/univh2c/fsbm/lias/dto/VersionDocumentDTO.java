package ma.univh2c.fsbm.lias.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VersionDocumentDTO {
    private Long id;
    private Integer version;
    private String cheminFichier;
    private LocalDateTime dateModification;
    private Long auteurId;
    private String auteurNom;
    private Long tailleFichier;
    private String commentaire;
}

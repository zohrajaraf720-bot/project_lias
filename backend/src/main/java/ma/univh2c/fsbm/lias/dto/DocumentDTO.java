package ma.univh2c.fsbm.lias.dto;

import lombok.*;
import ma.univh2c.fsbm.lias.enums.TypeDocument;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentDTO {
    private Long id;
    private String titre;
    private String cheminFichier;
    private TypeDocument typeDocument;
    private String empreinteSha256;
    private LocalDateTime dateUpload;
    private Integer version;
    private Long evenementId;
    private Long conventionId;
    private Long reunionId;
    private MembreResumeDTO auteur;
}

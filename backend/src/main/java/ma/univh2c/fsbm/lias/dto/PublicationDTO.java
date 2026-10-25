package ma.univh2c.fsbm.lias.dto;

import lombok.*;
import ma.univh2c.fsbm.lias.enums.TypePublication;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublicationDTO {
    private Long id;
    private String titre;
    private TypePublication type;
    private Integer annee;
    private String resume;
    private String lienDoi;
    private List<String> coAuteursExternes;
    private List<MembreResumeDTO> auteurs;
    private Long equipeId;
    private String equipeNom;
    private Long conventionId;
    private String conventionTitre;
}

package ma.univh2c.fsbm.lias.dto;

import lombok.*;
import ma.univh2c.fsbm.lias.enums.TypeActivite;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActiviteDTO {
    private Long id;
    private String titre;
    private String description;
    private TypeActivite type;
    private String lieu;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private MembreResumeDTO membre;
    private Long equipeId;
    private String equipeNom;
    private Long conventionId;
    private String conventionTitre;
}

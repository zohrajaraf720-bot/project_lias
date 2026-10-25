package ma.univh2c.fsbm.lias.dto;

import lombok.*;
import ma.univh2c.fsbm.lias.enums.TypeMandat;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MandatDTO {
    private Long id;
    private TypeMandat typeMandat;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private MembreResumeDTO membre;
    private Long equipeId;
    private String equipeNom;
    private Boolean actif;
}

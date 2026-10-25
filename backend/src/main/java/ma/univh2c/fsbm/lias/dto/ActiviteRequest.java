package ma.univh2c.fsbm.lias.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import ma.univh2c.fsbm.lias.enums.TypeActivite;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ActiviteRequest {
    @NotBlank(message = "Le titre est obligatoire")
    private String titre;

    private String description;

    @NotNull(message = "Le type d'activité est obligatoire")
    private TypeActivite type;

    private String lieu;

    @NotNull(message = "La date de début est obligatoire")
    private LocalDate dateDebut;

    private LocalDate dateFin;
    private Long membreId;
    private Long equipeId;
    private Long conventionId;
}

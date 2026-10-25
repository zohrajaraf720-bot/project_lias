package ma.univh2c.fsbm.lias.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import ma.univh2c.fsbm.lias.enums.TypeMandat;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MandatRequest {
    @NotNull(message = "Le type de mandat est obligatoire")
    private TypeMandat typeMandat;

    @NotNull(message = "Le membre est obligatoire")
    private Long membreId;

    private Long equipeId; // requis si CHEF_EQUIPE

    @NotNull(message = "La date de début est obligatoire")
    private LocalDate dateDebut;
}

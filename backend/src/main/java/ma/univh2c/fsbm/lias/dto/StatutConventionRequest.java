package ma.univh2c.fsbm.lias.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import ma.univh2c.fsbm.lias.enums.StatutConvention;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StatutConventionRequest {
    @NotNull(message = "Le statut est obligatoire")
    private StatutConvention statut;
}

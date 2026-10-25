package ma.univh2c.fsbm.lias.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AffectationEquipeRequest {
    @NotNull(message = "L'identifiant de l'équipe est requis")
    private Long equipeId;
}

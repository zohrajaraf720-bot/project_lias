package ma.univh2c.fsbm.lias.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PromotionRequest {
    @NotNull(message = "L'identifiant de l'équipe est obligatoire")
    private Long equipeId;
}

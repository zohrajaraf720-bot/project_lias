package ma.univh2c.fsbm.lias.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChangementChefEquipeRequest {

    @NotNull(message = "L'identifiant du nouveau chef d'équipe est obligatoire")
    private Long nouveauChefId;
}

package ma.univh2c.fsbm.lias.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RapportGenererRequest {
    @NotNull(message = "L'année est obligatoire")
    private Integer annee;
}

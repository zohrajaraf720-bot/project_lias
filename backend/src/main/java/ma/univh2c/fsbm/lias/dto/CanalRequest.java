package ma.univh2c.fsbm.lias.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CanalRequest {
    @NotNull(message = "L'identifiant du destinataire est obligatoire")
    private Long destinataireId;
}

package ma.univh2c.fsbm.lias.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttributionRequest {
    @NotNull(message = "Le matériel est obligatoire")
    private Long materielId;

    @NotNull(message = "Le membre bénéficiaire est obligatoire")
    private Long membreId;

    @NotNull(message = "La quantité est obligatoire")
    private Integer quantite;

    private Long demandeId;
}

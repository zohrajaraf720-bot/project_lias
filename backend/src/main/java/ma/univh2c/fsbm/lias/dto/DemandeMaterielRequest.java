package ma.univh2c.fsbm.lias.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DemandeMaterielRequest {
    @NotBlank(message = "La description du besoin est obligatoire")
    private String descriptionBesoin;

    @NotNull(message = "La quantité souhaitée est obligatoire")
    private Integer quantite;
}

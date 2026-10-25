package ma.univh2c.fsbm.lias.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EquipeRequest {
    @NotBlank(message = "Le nom de l'équipe est obligatoire")
    private String nom;

    private String description;
    private List<String> thematiques;
    private String logo;
    private Long chefEquipeId;
}

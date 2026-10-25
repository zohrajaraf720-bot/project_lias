package ma.univh2c.fsbm.lias.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import ma.univh2c.fsbm.lias.enums.TypePublication;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PublicationRequest {
    @NotBlank(message = "Le titre est obligatoire")
    private String titre;

    private TypePublication type;

    @NotNull(message = "L'année est obligatoire")
    private Integer annee;

    private String resume;
    private String lienDoi;
    private List<String> coAuteursExternes;
    private List<Long> auteursIds;
    private Long equipeId;
    private Long conventionId;
}

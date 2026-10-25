package ma.univh2c.fsbm.lias.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import ma.univh2c.fsbm.lias.enums.TypeInstitution;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PartenaireRequest {
    @NotBlank(message = "Le nom de l'institution est obligatoire")
    private String nomInstitution;

    @NotNull(message = "Le type d'institution est obligatoire")
    private TypeInstitution typeInstitution;

    private String pays;
    private String contactPrincipal;
    private String emailContact;
}

package ma.univh2c.fsbm.lias.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParametrageDTO {
    @NotBlank(message = "Le nom du laboratoire est obligatoire")
    private String nom;

    private String acronyme;
    private String etablissement;
    private String universite;
    private String description;
    private String adresse;
    private String emailContact;
    private String telephone;
    private String siteWeb;
    private String logo;
    private LocalDate dateCreation;
}

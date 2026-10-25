package ma.univh2c.fsbm.lias.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ConventionRequest {
    @NotBlank(message = "Le titre est obligatoire")
    private String titre;

    @NotNull(message = "Le partenaire est obligatoire")
    private Long partenaireId;

    @NotNull(message = "La date de signature est obligatoire")
    private LocalDate dateSignature;

    @NotNull(message = "La date d'expiration est obligatoire")
    private LocalDate dateExpiration;
}

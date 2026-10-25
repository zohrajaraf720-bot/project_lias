package ma.univh2c.fsbm.lias.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MaterielRequest {
    @NotBlank(message = "La désignation est obligatoire")
    private String designation;

    @NotNull(message = "La date d'arrivage est obligatoire")
    private LocalDate dateArrivage;

    @NotNull(message = "La quantité initiale est obligatoire")
    private Integer quantiteInitiale;
}

package ma.univh2c.fsbm.lias.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import ma.univh2c.fsbm.lias.enums.StatutMembre;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChangementStatutRequest {
    @NotNull(message = "Le nouveau statut est obligatoire")
    private StatutMembre nouveauStatut;
}

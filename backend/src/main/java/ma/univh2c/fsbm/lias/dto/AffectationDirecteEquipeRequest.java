package ma.univh2c.fsbm.lias.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AffectationDirecteEquipeRequest {

    @NotNull(message = "L'identifiant du membre est obligatoire")
    private Long membreId;

    /**
     * Identifiant de la nouvelle équipe.
     * null = détachement (aucune équipe / sans équipe).
     */
    private Long nouvelleEquipeId;

    /**
     * Motif / justification administrative de la décision (optionnel).
     */
    private String motif;
}

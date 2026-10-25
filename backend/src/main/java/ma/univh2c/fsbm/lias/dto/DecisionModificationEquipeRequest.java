package ma.univh2c.fsbm.lias.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DecisionModificationEquipeRequest {
    @JsonAlias({"motif", "commentaire"})
    private String motif;
}

package ma.univh2c.fsbm.lias.dto;

import lombok.*;

import com.fasterxml.jackson.annotation.JsonAlias;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DecisionMaterielRequest {
    @JsonAlias("commentaireDirection")
    private String commentaire;
    private Long materielId;
}

package ma.univh2c.fsbm.lias.dto;

import lombok.*;
import ma.univh2c.fsbm.lias.enums.EtatCompte;
import ma.univh2c.fsbm.lias.enums.RoleSysteme;
import ma.univh2c.fsbm.lias.enums.StatutMembre;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MeDTO {
    private Long id;
    private String email;
    private String nom;
    private String prenom;
    private String photo;
    private RoleSysteme roleSysteme;
    private StatutMembre statut;
    private EtatCompte etatCompte;
    private Long equipeId;
    private String equipeNom;
    private List<String> autorites;

    @com.fasterxml.jackson.annotation.JsonProperty("authorities")
    public List<String> getAuthorities() {
        return autorites;
    }

    private Boolean doitChangerMotDePasse;
}

package ma.univh2c.fsbm.lias.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MembreModificationRequest {
    private String nom;
    private String prenom;
    private String email;
    private String photo;
    private String biographie;
    private List<String> centresInteret;
    private String etablissementOrigine;
    private String laboratoireOrigine;
}

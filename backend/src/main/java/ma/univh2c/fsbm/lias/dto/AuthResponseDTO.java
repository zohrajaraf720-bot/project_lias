package ma.univh2c.fsbm.lias.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponseDTO {
    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private Boolean doitChangerMotDePasse;
    private MembreInterneDTO membre;

    @com.fasterxml.jackson.annotation.JsonProperty("utilisateur")
    public MembreInterneDTO getUtilisateur() {
        return membre;
    }
}

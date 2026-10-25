package ma.univh2c.fsbm.lias.service;

import lombok.extern.slf4j.Slf4j;
import ma.univh2c.fsbm.lias.exception.RegleMetierException;
import ma.univh2c.fsbm.lias.exception.RessourceIntrouvableException;
import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageService {

    private final Path rootLocation;
    private final Tika tika = new Tika();

    public FileStorageService(@Value("${lias.upload.dir:uploads/}") String uploadDir) {
        this.rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Impossible de créer le répertoire de stockage des fichiers", e);
        }
    }

    public String stockerFichier(MultipartFile fichier, String sousDossier) {
        if (fichier == null || fichier.isEmpty()) {
            throw new RegleMetierException("Le fichier ne peut pas être vide");
        }

        try {
            Path targetDir = this.rootLocation.resolve(sousDossier != null ? sousDossier : "").normalize();
            Files.createDirectories(targetDir);

            String originalName = fichier.getOriginalFilename();
            String extension = "";
            if (originalName != null && originalName.contains(".")) {
                extension = originalName.substring(originalName.lastIndexOf("."));
            }

            String filename = UUID.randomUUID() + extension;
            Path destinationFile = targetDir.resolve(filename).normalize();

            if (!destinationFile.getParent().startsWith(this.rootLocation)) {
                throw new RegleMetierException("Tentative de stockage en dehors du répertoire autorisé");
            }

            Files.copy(fichier.getInputStream(), destinationFile, StandardCopyOption.REPLACE_EXISTING);

            return (sousDossier != null && !sousDossier.isBlank() ? sousDossier + "/" : "") + filename;
        } catch (IOException e) {
            log.error("Erreur lors du stockage du fichier: {}", e.getMessage());
            throw new RuntimeException("Échec du stockage du fichier", e);
        }
    }

    public Resource chargerFichier(String cheminRelatif) {
        try {
            if (cheminRelatif == null || cheminRelatif.isBlank()) {
                throw new RessourceIntrouvableException("Chemin de fichier non spécifié");
            }
            Path file = this.rootLocation.resolve(cheminRelatif).normalize();
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() || resource.isReadable()) {
                return resource;
            } else {
                throw new RessourceIntrouvableException("Fichier introuvable: " + cheminRelatif);
            }
        } catch (MalformedURLException e) {
            throw new RessourceIntrouvableException("Fichier introuvable: " + cheminRelatif);
        }
    }

    public String calculerSha256(MultipartFile fichier) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(fichier.getBytes());
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException | IOException e) {
            log.warn("Impossible de calculer le SHA-256: {}", e.getMessage());
            return null;
        }
    }

    public String detecterTypeMime(MultipartFile fichier) {
        try {
            return tika.detect(fichier.getInputStream());
        } catch (IOException e) {
            return fichier.getContentType();
        }
    }
}

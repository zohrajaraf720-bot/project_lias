package ma.univh2c.fsbm.lias.repository;

import ma.univh2c.fsbm.lias.entity.Partenaire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PartenaireRepository extends JpaRepository<Partenaire, Long> {
    boolean existsByNomInstitutionIgnoreCase(String nom);
    List<Partenaire> findByArchiveFalse();
}

package com.oryfolks.lms_backend.repository;

import com.oryfolks.lms_backend.entity.CourseRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRatingRepository extends JpaRepository<CourseRating, Long> {
    /**
     * Fetch all ratings/reviews of a particular course.
     *
     * Used in:
     * - Course review section
     * - Comments/reviews display under course video
     */
    List<CourseRating> findByCourse_Id(Long courseId);

    /**
     * Calculate average rating of a course.
     *
     * Example:
     * If ratings are:
     * 5,4,5,3
     *
     * Average:
     * 4.25
     *
     * Used in:
     * - Employee dashboard
     * - Manager dashboard
     * - Course cards
     * - Course listings
     */
    @Query("""
            SELECT AVG(r.rating)
            FROM CourseRating r
            WHERE r.course.id = :courseId
            """)
    Double getAverageRating(
            @Param("courseId") Long courseId);

    /**
     * Get total number of ratings
     * submitted for a course.
     *
     * Example:
     * 120 ratings
     *
     * Used along with average rating.
     */
    @Query("""
            SELECT COUNT(r)
            FROM CourseRating r
            WHERE r.course.id = :courseId
            """)
    Long getRatingCount(
            @Param("courseId") Long courseId);

    /**
     * Delete all ratings of a user.
     *
     * Useful when:
     * - user account deleted
     * - cleanup operation
     */
    void deleteByUserId(Long userId);

    /**
     * Delete all ratings of a course.
     *
     * Useful when:
     * - course deleted
     * - admin cleanup
     */
    void deleteByCourseId(Long courseId);

    /**
     * Check whether user already rated
     * a particular course.
     *
     * This prevents duplicate ratings.
     *
     * Business Rule:
     * One employee can rate one course only once.
     */
    boolean existsByCourse_IdAndUser_Id(
            Long courseId,
            Long userId);

    /**
     * Fetch specific rating submitted by user
     * for a particular course.
     *
     * Can be useful later for:
     * - updating rating
     * - editing review
     * - showing existing rating
     */
    Optional<CourseRating> findByCourse_IdAndUser_Id(
            Long courseId,
            Long userId);
}
